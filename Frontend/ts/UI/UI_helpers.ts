
/*
 Function pour changer l'affichage des menus (afficher un et cacher les autres)

 - main = menu a afficher
 - toHide = menus a cacher
 - On parcourt la liste des menus a cacher et on leur met hidden
 - On toggle le menu principale
*/
export function toggleMenu(
	main?: HTMLElement | null,
	...toHide: (HTMLElement | null | undefined)[]
) {
	if (!main)
		return;

	toHide.forEach(menu => menu?.classList.add("hidden"));
	main.classList.toggle("hidden");
}

export function hideMenu(...toHide: (HTMLElement | null | undefined)[]
) {
	toHide.forEach(menu => menu?.classList.add("hidden"));
}
