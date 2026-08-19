import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GAMES_DIR = __dirname;
const JAR_DIR = path.join(GAMES_DIR, 'jar');
const ICONS_DIR = path.join(GAMES_DIR, 'icons');
const JSON_PATH = path.join(GAMES_DIR, 'games.json');

// Ensure output directories exist
if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
}
if (!fs.existsSync(JAR_DIR)) {
    fs.mkdirSync(JAR_DIR, { recursive: true });
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    const kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(0) + ' KB';
    const mb = kb / 1024;
    return mb.toFixed(1) + ' MB';
}

function extractScreenSize(props) {
    const keys = [
        'Nokia-MIDlet-Original-Display-Size',
        'Nokia-MIDlet-Target-Display-Size',
        'MIDlet-Screen-Size',
        'LGE-MIDlet-Target-Display-Size',
        'Siemens-MIDlet-Original-Display-Size'
    ];
    for (const k of keys) {
        if (props[k]) {
            const match = props[k].match(/(\d{2,4})\s*x\s*(\d{2,4})/i);
            if (match) return `${match[1]}x${match[2]}`;
        }
    }
    return null;
}

// Robust ZIP reader using Central Directory (handles all compression modes & obfuscated JARs)
function readZip(filePath) {
    const buf = fs.readFileSync(filePath);
    
    // Find End of Central Directory (0x06054b50) searching backwards
    let eocdOffset = -1;
    for (let i = buf.length - 22; i >= 0; i--) {
        if (buf.readUInt32LE(i) === 0x06054b50) {
            eocdOffset = i;
            break;
        }
    }

    if (eocdOffset === -1) {
        return { getFile: () => null, findFallbackIcon: () => null };
    }

    const totalEntries = buf.readUInt16LE(eocdOffset + 10);
    const cdOffset = buf.readUInt32LE(eocdOffset + 16);

    let offset = cdOffset;
    const entries = {};

    for (let i = 0; i < totalEntries && offset < eocdOffset; i++) {
        if (buf.readUInt32LE(offset) !== 0x02014b50) break;

        const compMethod = buf.readUInt16LE(offset + 10);
        const compSize = buf.readUInt32LE(offset + 20);
        const fileNameLen = buf.readUInt16LE(offset + 28);
        const extraLen = buf.readUInt16LE(offset + 30);
        const commentLen = buf.readUInt16LE(offset + 32);
        const localHeaderOffset = buf.readUInt32LE(offset + 42);

        const fileName = buf.toString('utf8', offset + 46, offset + 46 + fileNameLen);
        
        if (localHeaderOffset < buf.length - 30 && buf.readUInt32LE(localHeaderOffset) === 0x04034b50) {
            const localFileNameLen = buf.readUInt16LE(localHeaderOffset + 26);
            const localExtraLen = buf.readUInt16LE(localHeaderOffset + 28);
            const dataStart = localHeaderOffset + 30 + localFileNameLen + localExtraLen;
            
            entries[fileName.toLowerCase()] = {
                fileName,
                compMethod,
                compSize,
                dataStart
            };
        }

        offset += 46 + fileNameLen + extraLen + commentLen;
    }

    function extractBuffer(entry) {
        if (!entry) return null;
        const data = buf.subarray(entry.dataStart, entry.dataStart + entry.compSize);
        if (entry.compMethod === 0) {
            return data;
        } else if (entry.compMethod === 8) {
            try {
                return zlib.inflateRawSync(data);
            } catch (e) {
                try {
                    return zlib.inflateSync(data);
                } catch (e2) {
                    return null;
                }
            }
        }
        return data;
    }

    return {
        getFile(name) {
            if (!name) return null;
            const cleanName = name.replace(/^\//, '').trim().toLowerCase();
            let entry = entries[cleanName];
            if (!entry) {
                const key = Object.keys(entries).find(k => 
                    k.endsWith('/' + cleanName) || 
                    k === cleanName || 
                    k.replace(/^\//, '') === cleanName
                );
                if (key) entry = entries[key];
            }
            return extractBuffer(entry);
        },

        findFallbackIcon() {
            const keys = Object.keys(entries);
            const priorityMatch = keys.find(k => /\bicon\b/i.test(k) && /\.(png|jpg|jpeg)$/i.test(k)) ||
                                 keys.find(k => /icon/i.test(k) && /\.(png|jpg|jpeg)$/i.test(k)) ||
                                 keys.find(k => /\.(png|jpg|jpeg)$/i.test(k));
            if (priorityMatch) {
                return {
                    name: entries[priorityMatch].fileName,
                    buffer: extractBuffer(entries[priorityMatch])
                };
            }
            return null;
        }
    };
}

// Parse Manifest headers (supports folded lines per JAR spec)
function parseManifest(text) {
    const props = {};
    if (!text) return props;

    const unfolded = text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
    for (const line of unfolded.split('\n')) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
            const key = line.substring(0, colonIdx).trim();
            const val = line.substring(colonIdx + 1).trim();
            props[key] = val;
        }
    }
    return props;
}

function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'game';
}

function scanGames() {
    console.log('🔍 Scanning web/games/jar for J2ME game files...');
    
    if (!fs.existsSync(JAR_DIR)) {
        console.log('Directory web/games/jar does not exist.');
        return;
    }

    const jarFiles = fs.readdirSync(JAR_DIR).filter(f => f.endsWith('.jar'));
    if (jarFiles.length === 0) {
        console.log('No .jar files found in web/games/jar/');
        return;
    }

    let existingCatalog = [];
    if (fs.existsSync(JSON_PATH)) {
        try {
            existingCatalog = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
        } catch (e) {
            existingCatalog = [];
        }
    }

    const catalog = [];

    for (const file of jarFiles) {
        const fullPath = path.join(JAR_DIR, file);
        console.log(`\n📦 Processing: ${file}`);
        
        try {
            const fileStats = fs.statSync(fullPath);
            const fileSizeStr = formatFileSize(fileStats.size);
            const fileDateStr = fileStats.mtime.toISOString().split('T')[0];

            const zip = readZip(fullPath);
            const manifestBuf = zip.getFile('META-INF/MANIFEST.MF');
            const props = manifestBuf ? parseManifest(manifestBuf.toString('utf8')) : {};

            const baseNameNoExt = path.basename(file, '.jar');
            const title = props['MIDlet-Name'] || baseNameNoExt;
            const version = props['MIDlet-Version'] || '1.0.0';
            const vendor = props['MIDlet-Vendor'] || props['MIDlet-Vendor-Name'] || '';
            const releaseDate = props['MIDlet-Date'] || fileDateStr;
            const manifestRes = extractScreenSize(props);

            const appId = slugify(baseNameNoExt);

            let iconPathInZip = props['MIDlet-Icon'];
            if (!iconPathInZip && props['MIDlet-1']) {
                const parts = props['MIDlet-1'].split(',');
                if (parts.length >= 2 && parts[1].trim()) {
                    iconPathInZip = parts[1].trim();
                }
            }

            let iconWebPath = '';
            let iconBuf = iconPathInZip ? zip.getFile(iconPathInZip) : null;
            let ext = (iconPathInZip && path.extname(iconPathInZip)) ? path.extname(iconPathInZip).toLowerCase() : '.png';

            if (!iconBuf || iconBuf.length === 0) {
                const fallback = zip.findFallbackIcon();
                if (fallback && fallback.buffer) {
                    iconBuf = fallback.buffer;
                    ext = path.extname(fallback.name).toLowerCase() || '.png';
                }
            }

            if (iconBuf && iconBuf.length > 0) {
                const iconFileName = `${appId}${ext}`;
                const iconDiskPath = path.join(ICONS_DIR, iconFileName);
                fs.writeFileSync(iconDiskPath, iconBuf);
                iconWebPath = `games/icons/${iconFileName}`;
                console.log(`  └─ Extracted icon -> web/games/icons/${iconFileName}`);
            }

            const existing = existingCatalog.find(g => g.id === appId || g.jar === `games/jar/${file}`);

            const entry = {
                id: appId,
                title: title,
                version: version,
                vendor: vendor,
                size: fileSizeStr,
                releaseDate: releaseDate,
                description: props['MIDlet-Description'] || (vendor ? `By ${vendor}` : ''),
                icon: iconWebPath || (existing && existing.icon ? existing.icon : ''),
                jar: `games/jar/${file}`,
                screenSize: manifestRes || (existing && existing.screenSize) || '240x320',
                phoneType: (existing && existing.phoneType) || 'Nokia',
                enableSound: (existing && typeof existing.enableSound === 'boolean') ? existing.enableSound : true
            };

            catalog.push(entry);
            console.log(`  └─ Title: "${title}" | Version: "${version}" | Size: ${fileSizeStr} | Date: ${releaseDate}`);
        } catch (err) {
            console.error(`❌ Failed to process ${file}:`, err.message);
        }
    }

    fs.writeFileSync(JSON_PATH, JSON.stringify(catalog, null, 2), 'utf8');
    console.log(`\n✅ Updated web/games/games.json with ${catalog.length} game(s)!`);
}

scanGames();
