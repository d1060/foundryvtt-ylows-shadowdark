export default class RandomizerSD {
    static syllabes = [
        [
            "A",
            "E",
            "I",
            "U",
            "An",
            "En",
            "In",
            "Un",
            "Ak",
            "Ek",
            "Ik",
            "Uk",
            "Ar",
            "Er",
            "Ir",
            "Or",
            "Ur",
            "As",
            "Es",
            "Al",
            "El",
            "Il",
            "Ol",
            "Ul",
            "Ca",
            "Ce",
            "Ci",
            "Co",
            "Da",
            "De",
            "Di",
            "Do",
            "Du",
            "Na",
            "Ne",
            "Ni",
            "No",
            "Nu",
            "Tha",
            "The",
            "Thu",
            "Thar",
            "Ther",
            "Thir",
            "Thor",
            "Thur",
            "Gal",
            "Gol",
            "Dor",
        ],
        [
            "", "", "", "",
            "a",
            "ae",
            "ael",
            "iel",
            "ar",
            "er",
            "ir",
            "or",
            "ur",
            "ag",
            "eg",
            "ig",
            "og",
            "ug",
            "an",
            "en",
            "in",
            "on",
            "un",
            "e",
            "o",
            "ba",
            "be",
            "bi",
            "bo",
            "bu",
            "da",
            "de",
            "di",
            "do",
            "du",
            "ga",
            "ge",
            "gi",
            "go",
            "gu",
            "la",
            "le",
            "li",
            "ly",
            "lo",
            "lu",
            "da",
            "mar",
            "mer",
            "mir",
            "mor",
            "mur",
            "n",
            "na",
            "ne",
            "ni",
            "no",
            "nu",
            "ran",
            "ren",
            "rin",
            "ron",
            "run",
            "va",
            "ve",
            "vi",
            "vo",
            "vu",
        ],
        [
            "",
            "a",
            "e",
            "i",
            "o",
            "u",
            "an",
            "en",
            "in",
            "on",
            "un",
            "ar",
            "er",
            "ir",
            "or",
            "ur",
            "ck",
            "dan",
            "den",
            "don",
            "dun",
            "dal",
            "del",
            "dil",
            "dul",
            "k",
            "la",
            "lan",
            "lann",
            "len",
            "lenn",
            "lin",
            "lyn",
            "lynn",
            "lon",
            "lun",
            "las",
            "les",
            "lys",
            "los",
            "lus",
            "lur",
            "lon",
            "lyn",
            "len",
            "lus",
            "lian",
            "lien",
            "lion",
            "liun",
            "lorn",
            "na",
            "ne",
            "ni",
            "no",
            "nu",
            "nd",
            "orn",
            "rak",
            "ran",
            "ren",
            "ron",
            "run",
            "ral",
            "rel",
            "ril",
            "rol",
            "rul",
            "rian",
            "rien",
            "rin",
            "rion",
            "riun",
            "wen",
            "wan",
            "zal",
            "zel",
            "zan",
            "zen",
            "zin",
            "zon",
            "zar",
            "zer",
            "zir",
            "zor",
            "zur",
        ]
    ];

    static replacements = [
        ["nr", "n", "r"],
        ["rn", "n", "r"],
        ["nb", "n"],
        ["kn", "k", "n"],
        ["rd", "r", "d"],
        ["kv", "v"],
        ["kb", "k", "b"],
        ["dade", "da", "de"],
        ["deda", "da", "de"],
        ["lnl", "ln", "nl"],
        ["sbo", "so"],
        ["nn", "n"],
    ];

    static newName() {
        let name = '';
        for (let syllabeCollection of this.syllabes)
        {
            const syllabe = syllabeCollection[Math.floor(Math.random() * syllabeCollection.length)];
            name += syllabe;
        }

        for (let replacementArray of this.replacements) {
            if (name.includes(replacementArray[0]))
            {
                const replace = replacementArray[Math.floor(Math.random(replacementArray.length - 1)) + 1];
                name = name.replace(replacementArray[0], replace);
            }
        }
        return name;
    }

	static newCharacter() {
		const charData = {
			name: RandomizerSD.newName(),
			type: "Player",
			system: {
				attributes: {
					hp: {
						base: 1,
						value: 1,
						temp: 0,
					}
				},
				level: {
					grid: 1,
					value: 1,
					xp: 0,
				},
				abilities: this.randomizeAbilitiesWithPoints(6),
				magic: {
					type: "",
					nanoMagicTalents: [],
					auraMagicTalents: [],
					metalMagicTalents: [],
					nanoPoints: {
						value: 0,
						base: 0,
					},
				},
				abilitiesPoints: "",
				ancestry: "",
				background: "",
				alignment: "neutral",
				move: 5,
				deity: "",
				class: "",
				languages: [],
				patron: "",
				coins: {
					gp: 60,
					sp: 0,
					cp: 0,
				},
				showLevelUp: false,
			}
		};

        return charData;
	}

    static randomizeAbilitiesWithPoints(expectedPoints) {
        let attrs = [
            (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1),
            (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1),
            (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1),
            (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1),
            (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1),
            (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1)
        ]

        let mods = this.modsOfAttributes(attrs);
        let points = this.pointsOfMods(mods);
        let pointSum = points.reduce((acc, val) => acc + val, 0);
        let averageExpectedAttr = this.averageByExpectedPoints(expectedPoints);

        while (pointSum != expectedPoints) {
            const index = Math.floor(Math.random() * 6);
            const attr = attrs[index];
            if ((pointSum > expectedPoints && attr > averageExpectedAttr) || (pointSum < expectedPoints && attr < averageExpectedAttr)) {
                attrs[index] = (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1);
                mods = this.modsOfAttributes(attrs);
                points = this.pointsOfMods(mods);
                pointSum = points.reduce((acc, val) => acc + val, 0);
            }
        }

        let indexes = [0, 1, 2, 3, 4, 5];

        const abilities = {
            str: {
                base: 10,
                mod: 0,
            },
            int: {
                base: 10,
                mod: 0,
            },
            dex: {
                base: 10,
                mod: 0,
            },
            wis: {
                base: 10,
                mod: 0,
            },
            con: {
                base: 10,
                mod: 0,
            },
            cha: {
                base: 10,
                mod: 0,
            }
        };

        const attrKeys = ['str', 'int', 'dex', 'wis', 'con', 'cha'];
        for (const attrKey of attrKeys) {
            let indexesIndex = Math.floor(Math.random() * indexes.length);
            let index = indexes[indexesIndex];
            indexes.splice(indexesIndex, 1);

            abilities[attrKey] = {
                base: attrs[index],
                mod: mods[index],
            }
        }

        return abilities;
    }

    static modsOfAttributes(attrs) {
        let mods = [];
        for (let attr of attrs) {
            const mod = Math.floor((attr - 10) / 2);
            mods.push(mod);
        }
        return mods;
    }

    static pointsOfMods(mods) {
        let points = []
        for (let mod of mods) {
            switch(mod) {
                case -4: points.push(-7); break;
                case -3: points.push(-4); break;
                case -2: points.push(-2); break;
                case -1: points.push(-1); break;
                case 0: points.push(0); break;
                case 1: points.push(1); break;
                case 2: points.push(2); break;
                case 3: points.push(4); break;
                case 4: points.push(7); break;
            }
        }
        return points;
    }

    static averageByExpectedPoints(expectedPoints) {
        const averageExpectedPoints = Math.floor(expectedPoints / 6);
        if (averageExpectedPoints <= -42) return 3;
        if (averageExpectedPoints <= -22) return 4;
        if (averageExpectedPoints <= -12) return 6;
        if (averageExpectedPoints <= -6) return 8;
        if (averageExpectedPoints <= 0) return 10;
        if (averageExpectedPoints <= 6) return 12;
        if (averageExpectedPoints <= 12) return 14;
        if (averageExpectedPoints <= 24) return 16;
        return 18;
    }

}