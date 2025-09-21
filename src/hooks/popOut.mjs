import EvolutionGridSD from "../apps/EvolutionGridSD.mjs";

export const PopOut = {
    attach: () => {
        // When an app is popped out (window just opened)
        Hooks.on("PopOut:popout", (app, popout) => {

        });

        // While content is being moved to the new window
        Hooks.on("PopOut:loading", (app, popout) => {

        });        

        // When the DOM has finished moving into the new window (safe to query)
        Hooks.on("PopOut:loaded", (app, node) => {
            if (typeof app == 'object' && app instanceof EvolutionGridSD) {
                node.style.width = "100%";
                node.style.height = "100%";
                node.style.maxHeight = "unset";
            }
        });
    }
}