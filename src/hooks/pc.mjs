export const PCHooks = {
	attach: () => {
		Hooks.on("modifyTokenAttribute", (data, updates) => {
			if (data.attribute === 'attributes.hp') {
				var newHP = data.value;
			}
		});
	},
};
