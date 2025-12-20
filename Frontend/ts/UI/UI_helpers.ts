
/*
Function pour changer l'affichage des menus (afficher un et cacher les autres)
*/
export function toggleMenu(
	main?: HTMLElement | null,
	...toHide: (HTMLElement | null | undefined)[]
) {
	if (!main) return;

	toHide.forEach(menu => menu?.classList.add("hidden"));
	main.classList.toggle("hidden");
}
