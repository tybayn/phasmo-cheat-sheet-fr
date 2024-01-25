const themes = {
    "Défaut": "theme-default",
    "Bérurier": "theme-berry",
    "Noir et blanc": "theme-black-white",
    "Crépuscule": "theme-dusk",
    "Givre": "theme-frost",
    "Halloween": "theme-halloween",
    "Aurores boréales": "theme-northern-lights",
    "Fierté": "theme-pride",
    "Épicéa": "theme-spruce",
    "Acier": "theme-steel",
    "Coucher de soleil": "theme-sunset",
    "Crépuscule": "theme-twilight",
    "ZN-Elite" : "theme-zn"
}

function loadThemes(){
    let theme_options = ""
    Object.keys(themes).forEach((key) => {
        theme_options += `<option value="${key}">${key}</option>`
    })
    $("#theme").html(theme_options)
}

function changeTheme(name = null){

    let changeObjects = [
        ".ghost_card",".menu","#settings_box","#settings_tab",
        "#event_box","#event_tab","#wiki_box","#wiki_tab",
        "#maps_box","#maps_tab","#language_box","#language_tab",
        "#theme_box","#theme_tab","#info_box","#info_box_voice"
    ]

    let theme_name = name != null ? name : $("#theme").val()

    changeObjects.forEach((item) => {
        $(item).removeClass(Object.values(themes))
        $(item).addClass(themes[theme_name])
    })
}