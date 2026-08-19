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

// Zero-dependency ZIP reader
function readZip(filePath) {
    const buf = fs.readFileSync(filePath);
    let offset = 0;
    const entries = {};

    while (offset < buf.length - 30) {
        if (buf.readUInt32LE(offset) !== 0x04034b50) {
            offset++;
            continue;
        }

        const compMethod = buf.readUInt16LE(offset + 8);
        const compSize = buf.readUInt32LE(offset + 18);
        const fileNameLen = buf.readUInt16LE(offset + 26);
        const extraLen = buf.readUInt16LE(offset + 28);

        const fileName = buf.toString('utf8', offset + 30, offset + 30 + fileNameLen);
        const dataStart = offset + 30 + fileNameLen + extraLen;
        const compData = buf.subarray(dataStart, dataStart + compSize);

        entries[fileName] = { compMethod, compData };
        offset = dataStart + compSize;
    }

    return {
        getFile(name) {
            if (!name) return null;
            const cleanName = name.replace(/^\//, '').trim();
            const key = Object.keys(entries).find(k => 
                k.toLowerCase() === cleanName.toLowerCase() || 
                k.replace(/^\//, '').toLowerCase() === cleanName.toLowerCase()
            );
            if (!key) return null;
            const entry = entries[key];
            if (entry.compMethod === 0) {
                return entry.compData;
            } else if (entry.compMethod === 8) {
                try {
                    return zlib.inflateRawSync(entry.compData);
                } catch (e) {
                    return null;
                }
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
            if (iconPathInZip) {
                const iconBuf = zip.getFile(iconPathInZip);
                if (iconBuf && iconBuf.length > 0) {
                    const ext = path.extname(iconPathInZip).toLowerCase() || '.png';
                    const iconFileName = `${appId}${ext}`;
                    const iconDiskPath = path.join(ICONS_DIR, iconFileName);
                    fs.writeFileSync(iconDiskPath, iconBuf);
                    iconWebPath = `games/icons/${iconFileName}`;
                    console.log(`  └─ Extracted icon -> web/games/icons/${iconFileName}`);
                }
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
