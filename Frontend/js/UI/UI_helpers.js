/*
 Function pour changer l'affichage des menus (afficher un et cacher les autres)

 - main = menu a afficher
 - toHide = menus a cacher
 - On parcourt la liste des menus a cacher et on leur met hidden
 - On toggle le menu principale (si il steakhache on l'affiche si il est affiche on le cache)


  la blague du steak etait nulle deso jassume pas, bisous quand meme
*/
export function toggleMenu(main, ...toHide) {
    if (!main)
        return;
    toHide.forEach(menu => menu === null || menu === void 0 ? void 0 : menu.classList.add("hidden"));
    main.classList.toggle("hidden");
}
