const SYSTEM_ID = "shadowdark";
const FILE_SOURCE = "systems/shadowdark/assets/";
const FILE_TARGET = 'body_parts'
const CONCURRENCY = 6;      
const IMG_EXTS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".bmp", ".svg"];
const IMG_EXT = /\.(png|jpg|jpeg|webp|gif|avif|bmp|svg)$/i;

/** Recursively collect files under a directory that match extensions. */
async function listBodyTypeImages(source, target) {
    const fp = new foundry.applications.apps.FilePicker({current: source});
    const files = await fp.browse('systems/shadowdark/assets/body_parts', {extensions: IMG_EXTS, render: false});
    return files?.result?.files ?? [];
}

/** Load one texture in the background (preferred: Pixi background queue). */
function backgroundLoadTexture(path) {
    // In modern Foundry (PIXI v7), this queues a non-blocking background load:
    if (PIXI?.Assets?.backgroundLoad) {
        return PIXI.Assets.backgroundLoad(path).catch(err => {
            shadowdark.warn(`Failed to background load`, path, err);
        });
    }
    // Fallback: Foundry helper; consider not awaiting to keep it background-ish
    return loadTexture(path).catch(err => {
        shadowdark.warn(`Failed to loadTexture`, path, err);
    });
}

/** Throttle loads so you don’t spike bandwidth/CPU. */
async function preloadTextures(paths, concurrency = 6) {
    // simple worker pool
    const q = paths.slice();
    const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
        while (q.length) {
            const next = q.shift();
            await backgroundLoadTexture(next);
        }
    });
    await Promise.allSettled(workers);
    shadowdark.log(`Preloaded ${paths.length} textures`);
}

export async function preLoadBodyPartImages() {
    try {
        const all = await listBodyTypeImages(FILE_SOURCE, FILE_TARGET);
        // Kick this off, but don't await it—keep startup snappy:
        void preloadTextures(all, CONCURRENCY);
    } catch (err) {
        shadowdark.warn(`Preload failed`, err);
    }
}