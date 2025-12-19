export function toggleMenu(
	main?: HTMLElement | null,
	...toHide: (HTMLElement | null | undefined)[]
) {
	if (!main) return;

	toHide.forEach(menu => menu?.classList.add("hidden"));
	main.classList.toggle("hidden");
}
