/*
Function pour changer l'affichage des menus (afficher un et cacher les autres)
*/
export function toggleMenu(main, ...toHide) {
    if (!main)
        return;
    toHide.forEach(menu => menu === null || menu === void 0 ? void 0 : menu.classList.add("hidden"));
    main.classList.toggle("hidden");
}
