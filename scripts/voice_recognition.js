const levenshtein_distance = (str1 = '', str2 = '') => {
    const track = Array(str2.length + 1).fill(null).map(() =>
        Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i += 1) {
        track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
        track[j][0] = j;
    }
    for (let j = 1; j <= str2.length; j += 1) {
        for (let i = 1; i <= str1.length; i += 1) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(
                track[j][i - 1] + 1,
                track[j - 1][i] + 1,
                track[j - 1][i - 1] + indicator,
            );
        }
    }
    return track[str2.length][str1.length];
};

let running_log = []

$.fn.isInViewport = function () {
    let elementTop = $(this).offset().top;
    let elementBottom = elementTop + $(this).outerHeight();

    let viewportTop = $(window).scrollTop();
    let viewportBottom = viewportTop + window.innerHeight;

    return elementBottom > viewportTop && elementTop < viewportBottom;
}

function reset_voice_status() {
    setTimeout(function () {
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic.png)";
        document.getElementById("voice_recognition_status").className = "pulse_animation"
    }, 1000)
}

function domovoi_show_last() {
    $("#domovoi-text").show()
    $("#domovoi-img").attr("src", "imgs/domovoi-heard.png")
}

function domovoi_hide_last() {
    $("#domovoi-text").hide()
    $("#domovoi-img").attr("src", "imgs/domovoi.png")
}


function domovoi_heard(message) {
    $("#domovoi-text").text(message.toLowerCase())
    $("#domovoi-text").show()
    $("#domovoi-img").attr("src", "imgs/domovoi-heard.png")
    setTimeout(function () {
        $("#domovoi-text").hide()
        $("#domovoi-img").attr("src", markedDead ? "imgs/domovoi-died.png" : "imgs/domovoi.png")
    }, 2000)
}

function domovoi_not_heard() {
    $("#domovoi-img").attr("src", user_settings['domo_side'] == 1 ? "imgs/domovoi-guess-flip.png" : "imgs/domovoi-guess.png")
    setTimeout(function () {
        $("#domovoi-img").attr("src", markedDead ? "imgs/domovoi-died.png" : "imgs/domovoi.png")
    }, 3000)
}

function domovoi_print_logs() {
    console.log("----------------------------------------------------------------")
    console.log("Domo memory:")
    running_log.forEach(function (item, idx) {
        console.log(`--${idx}--`)
        for (const [key, value] of Object.entries(item)) {
            console.log(`${key}: ${value}`)
        }
    })
    console.log("----------------------------------------------------------------")
}

function parse_speech(vtext) {
    vtext = vtext.toLowerCase().trim()
    running_log.push({
        "Time": new Date().toJSON().replace('T', ' ').split('.')[0],
        "Raw": vtext
    })
    if (running_log.length > 5) {
        running_log.shift()
    }
    let cur_idx = running_log.length - 1

    domovoi_msg = ""

    for (const [key, value] of Object.entries(ZNLANG['overall'])) {
        for (var i = 0; i < value.length; i++) {
            vtext = vtext.replace(value[i], key);
        }
    }

    running_log[cur_idx]["Cleaned"] = vtext

    if (vtext.startsWith('ghost speed') || vtext.startsWith('vitesse entité')) {
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized ghost speed command")
        running_log[cur_idx]["Type"] = "ghost speed"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('ghost speed', "").replace('vitesse entité', "").trim()
        domovoi_msg += "vitesse de l'entité placée sur "

        vtext = vtext.replace('three', '3').replace('trois', '3')
        vtext = vtext.replace('two', '2').replace('to', '2').replace('deux', '2').replace('de', '2')
        vtext = vtext.replace('one', '1').replace('un', '1')
        vtext = vtext.replace('zero', '0').replace('zéro', '0')


        var smallest_num = '150'
        var smallest_val = 100
        var prev_value = document.getElementById("ghost_modifier_speed").value
        var all_ghost_speed = ['50', '75', '100', '125', '150']
        var all_ghost_speed_convert = {
            '50': 0,
            '75': 1,
            '100': 2,
            '125': 3,
            '150': 4
        }

        for (var i = 0; i < all_ghost_speed.length; i++) {
            var leven_val = levenshtein_distance(all_ghost_speed[i], vtext)
            if (leven_val < smallest_val) {
                smallest_val = leven_val
                smallest_num = all_ghost_speed[i]
            }
        }
        domovoi_msg += smallest_num

        document.getElementById("ghost_modifier_speed").value = all_ghost_speed_convert[smallest_num] ?? 2

        if (prev_value != all_ghost_speed_convert[smallest_num]) {
            setTempo();
            bpm_calc(true);
            saveSettings();
            send_state()
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    } else if (vtext.startsWith('ghost') || vtext.startsWith('entité')) {
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized ghost command")
        running_log[cur_idx]["Type"] = "ghost"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('ghost', "").replace('entité', "").trim()
        domovoi_msg += "marqué "

        var smallest_ghost = "Spirit"
        var smallest_val = 100
        var vvalue = 0
        if (vtext.startsWith("not ") || vtext.startsWith("knot ") || vtext.startsWith('pas ') || vtext.startsWith('par ')) {
            vtext = vtext.replace('not ', "").replace('knot ', "").replace('pas ', "").trim()
            vvalue = 0
            domovoi_msg += "pas "
        } else if (vtext.startsWith("undo ") || vtext.startsWith("undue ") || vtext.startsWith("on do ") || vtext.startsWith("on due ") || vtext.startsWith("clear") || vtext.startsWith("annuler") || vtext.startsWith("annulée") || vtext.startsWith("effacer")) {
            vtext = vtext.replace('undo ', "").replace('undue ', "").replace("on do ", "").replace("on due ", "").replace("clear ", "").replace("annuler ", "").replace("effacer", "").trim()
            vvalue = 0
            domovoi_msg = "annulé "
        } else if (vtext.startsWith("guess ") || vtext.startsWith("prédire ") || vtext.startsWith("prédit ") || vtext.startsWith("prédiction ") || vtext.startsWith("deviner ") || vtext.startsWith("devinée ")) {
            vtext = vtext.replace('guess ', "").replace('prédire ', "").replace("prédit ", "").replace("prédiction ", "").replace("deviner ", "").replace("devinée ", "").trim()
            vvalue = 3
            domovoi_msg = "prédiction "
        } else if (vtext.startsWith("select ") || vtext.startsWith("deselect ") || vtext.startsWith("séléctionner ") || vtext.startsWith("séléctionnée ") || vtext.startsWith("choisir ")) {
            vtext = vtext.replace('deselect ', "").replace('select ', "").replace('séléctionner ', "").replace('séléctionnée ', "").replace('choisir ', "").trim()
            vvalue = 2
            domovoi_msg = "sélectionné "
        } else if (vtext.startsWith("hide ") || vtext.startsWith("remove ") || vtext.startsWith("cacher ") || vtext.startsWith("barrer ") || vtext.startsWith("barrée ") || vtext.startsWith("rayer ")) {
            vtext = vtext.replace('hide ', "").replace('remove ', "").replace('cacher ', "").replace('barrer ', "").replace('barrée ', "").replace('rayer ', "").trim()
            vvalue = -1
            domovoi_msg = "rayé "
        } else if (vtext.startsWith("dead ") || vtext.startsWith("killed by ") || vtext.startsWith("killed ") || vtext.startsWith("tué ") || vtext.startsWith("tuer ") || vtext.startsWith("tué par ") || vtext.startsWith("mort ")) {
            vtext = vtext.replace('dead ', "").replace('killed by ', "").replace('killed ', "").replace('tué ', "").replace('tuer ', "").replace('tué par ', "").replace('mort ', "").trim()
            vvalue = -2
            domovoi_msg = "tué par "
        } else if (vtext.startsWith("show ") || vtext.startsWith("data ") || vtext.startsWith("info ") || vtext.startsWith("informations ") || vtext.startsWith("montrer ") || vtext.startsWith("montrée ") || vtext.startsWith("données ") || vtext.startsWith("donner ") || vtext.startsWith("voir ")) {
            vtext = vtext.replace('show ', "").replace('data ', "").replace('info ', "").replace('informations ', "").replace('montrer ', "").replace('montrée ', "").replace('données ', "").replace('donner ', "").replace('voir ', "").trim()
            vvalue = -10
            domovoi_msg = "affichage des informations pour "
        }

        // Common fixes to ghosts
        var prevtext = vtext;
        for (const [key, value] of Object.entries(ZNLANG['ghosts'])) {
            for (var i = 0; i < value.length; i++) {
                if (vtext.startsWith(value[i])) {
                    vtext = key
                }
            }
        }

        for (var i = 0; i < Object.keys(all_ghosts).length; i++) {
            var leven_val = levenshtein_distance(Object.values(all_ghosts)[i].toLowerCase(), vtext)
            if (leven_val < smallest_val) {
                smallest_val = leven_val
                smallest_ghost = Object.values(all_ghosts)[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_ghost}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_ghost}`
        domovoi_msg += smallest_ghost

        if (vvalue == 0) {
            fade(document.getElementById(rev(all_ghosts,smallest_ghost)));
        } else if (vvalue == 3) {
            guess(document.getElementById(rev(all_ghosts,smallest_ghost)));
            if (!$(document.getElementById(rev(all_ghosts,smallest_ghost))).isInViewport())
                document.getElementById(rev(all_ghosts,smallest_ghost)).scrollIntoView({
                    alignToTop: true,
                    behavior: "smooth"
                })
        } else if (vvalue == 2) {
            select(document.getElementById(rev(all_ghosts,smallest_ghost)));
            if (!$(document.getElementById(rev(all_ghosts,smallest_ghost))).isInViewport())
                document.getElementById(rev(all_ghosts,smallest_ghost)).scrollIntoView({
                    alignToTop: true,
                    behavior: "smooth"
                })
        } else if (vvalue == -1) {
            remove(document.getElementById(rev(all_ghosts,smallest_ghost)));
        } else if (vvalue == -2) {
            died(document.getElementById(rev(all_ghosts,smallest_ghost)));
            if (!$(document.getElementById(rev(all_ghosts,smallest_ghost))).isInViewport())
                document.getElementById(rev(all_ghosts,smallest_ghost)).scrollIntoView({
                    alignToTop: true,
                    behavior: "smooth"
                })
        } else if (vvalue == -10) {
            if (!$(document.getElementById(rev(all_ghosts,smallest_ghost))).isInViewport())
                document.getElementById(rev(all_ghosts,smallest_ghost)).scrollIntoView({
                    alignToTop: true,
                    behavior: "smooth"
                })
        }

        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    } else if (vtext.startsWith('evidence') || vtext.startsWith('preuve')) {
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized evidence command")
        running_log[cur_idx]["Type"] = "evidence"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('evidence', "").replace('preuve ', "").trim()
        domovoi_msg += "preuve marquée "

        var smallest_evidence = "emf 5"
        var smallest_val = 100
        var vvalue = 1
        if (vtext.startsWith("not ") || vtext.startsWith("knot ") || vtext.startsWith('pas ') || vtext.startsWith('par ')) {
            vtext = vtext.replace('not ', "").replace('knot ', "").replace('pas ', "").trim()
            vvalue = -1
            domovoi_msg += "pas "
        } else if (vtext.startsWith("undo ") || vtext.startsWith("undue ") || vtext.startsWith("on do ") || vtext.startsWith("on due ") || vtext.startsWith("clear") || vtext.startsWith("annuler") || vtext.startsWith("annulée") || vtext.startsWith("effacer")) {
            vtext = vtext.replace('undo ', "").replace('undue ', "").replace("on do ", "").replace("on due ", "").replace("clear ", "").replace("annuler ", "").replace("effacer", "").trim()
            vvalue = 0
            domovoi_msg = "annulé "
        }

        // Common replacements for evidence names
        var prevtext = vtext;
        for (const [key, value] of Object.entries(ZNLANG['evidence'])) {
            for (var i = 0; i < value.length; i++) {
                if (vtext.startsWith(value[i])) {
                    vtext = key
                }
            }
        }

        for (var i = 0; i < Object.keys(all_evidence).length; i++) {
            var leven_val = levenshtein_distance(Object.values(all_evidence)[i].toLowerCase(), vtext)
            if (leven_val < smallest_val) {
                smallest_val = leven_val
                smallest_evidence = Object.values(all_evidence)[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_evidence}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_evidence}`
        domovoi_msg += smallest_evidence

        if (!$(document.getElementById(rev(all_evidence,smallest_evidence)).querySelector("#checkbox")).hasClass("block")) {
            while (vvalue != {
                    "good": 1,
                    "bad": -1,
                    "neutral": 0
                } [document.getElementById(rev(all_evidence,smallest_evidence)).querySelector("#checkbox").classList[0]]) {
                tristate(document.getElementById(rev(all_evidence,smallest_evidence)));
            }
        } else {
            domovoi_msg = `La preuve ${smallest_evidence} est vérouillée !`
        }


        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()

    } else if (vtext.startsWith('monkey paw') || vtext.startsWith('patte de singe')) {
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized monkey paw command")
        running_log[cur_idx]["Type"] = "monkey paw"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('monkey paw', "").replace('patte de singe', "").trim()
        domovoi_msg += "marqué  "

        var smallest_evidence = "emf 5"
        var smallest_val = 100
        var vvalue = 1

        // Common replacements for evidence names
        var prevtext = vtext;
        for (const [key, value] of Object.entries(ZNLANG['evidence'])) {
            for (var i = 0; i < value.length; i++) {
                if (vtext.startsWith(value[i])) {
                    vtext = key
                }
            }
        }

        for (var i = 0; i < Object.keys(all_evidence).length; i++) {
            var leven_val = levenshtein_distance(Object.values(all_evidence)[i].toLowerCase(), vtext)
            if (leven_val < smallest_val) {
                smallest_val = leven_val
                smallest_evidence = Object.values(all_evidence)[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_evidence}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_evidence}`
        domovoi_msg += `${smallest_evidence} prouvé par la patte de singe`

        monkeyPawFilter($(document.getElementById(rev(all_evidence,smallest_evidence))).parent().find(".monkey-paw-select"))

        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()

    } else if (vtext.startsWith('speed') || vtext.startsWith('feed') || vtext.startsWith('vitesse')) {
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized speed command")
        running_log[cur_idx]["Type"] = "speed"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('speed', "").replace('feed', "").replace('vitesse', "").trim()
        domovoi_msg += "vitesse marquée "

        var smallest_speed = "normal"
        var smallest_val = 100
        var vvalue = 1


        if (vtext.startsWith("not ") || vtext.startsWith("knot ") || vtext.startsWith('pas ') || vtext.startsWith('par ')) {
            vtext = vtext.replace('not ', "").replace('knot ', "").replace('pas ', "").trim()
            vvalue = 0
            domovoi_msg += "pas "
        } else if (vtext.startsWith("undo ") || vtext.startsWith("undue ") || vtext.startsWith("on do ") || vtext.startsWith("on due ") || vtext.startsWith("clear") || vtext.startsWith("annuler") || vtext.startsWith("annulée") || vtext.startsWith("effacer")) {
            vtext = vtext.replace('undo ', "").replace('undue ', "").replace("on do ", "").replace("on due ", "").replace("clear ", "").replace("annuler ", "").replace("effacer", "").trim()
            vvalue = -1
            domovoi_msg = "annulé "
        }

        vtext = vtext.replace("has ", "")
        if (vtext.startsWith("ligne de vue")) {
            console.log(`${vtext} >> Ligne de Vue`)
            running_log[cur_idx]["Debug"] = `${vtext} >> Line of Sight`

            if ((vvalue == 0 && all_los()) || (vvalue == 1 && all_not_los())) {
                domovoi_msg = `${vvalue == 0 ? 'All' : 'No'} current ghosts have LOS!`
            } else {
                while (!$(document.getElementById("LOS").querySelector("#checkbox")).hasClass(["neutral", "bad", "good"][vvalue + 1])) {
                    tristate(document.getElementById("LOS"));
                }
                domovoi_msg = `${vvalue == -1 ? 'cleared' : vvalue == 0 ? 'marked not' : 'marked'} line of sight`
            }
        } else {

            if (vvalue == -1) {
                vvalue = 0
            }

            // Common replacements for speed
            var prevtext = vtext;
            for (const [key, value] of Object.entries(ZNLANG['speed'])) {
                for (var i = 0; i < value.length; i++) {
                    if (vtext.startsWith(value[i])) {
                        vtext = key
                    }
                }
            }

            for (var i = 0; i < Object.keys(all_speed).length; i++) {
                var leven_val = levenshtein_distance(Object.values(all_speed)[i].toLowerCase(), vtext)
                if (leven_val < smallest_val) {
                    smallest_val = leven_val
                    smallest_speed = Object.values(all_speed)[i]
                }
            }
            console.log(`${prevtext} >> ${vtext} >> ${smallest_speed}`)
            running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_speed}`
            domovoi_msg += smallest_speed

            if (!$(document.getElementById(rev(all_speed,smallest_speed)).querySelector("#checkbox")).hasClass("block")) {
                while (vvalue != {
                        "good": 1,
                        "neutral": 0
                    } [document.getElementById(rev(all_speed,smallest_speed)).querySelector("#checkbox").classList[0]]) {
                    dualstate(document.getElementById(rev(all_speed,smallest_speed)));
                }
            } else {
                domovoi_msg = `La vitesse ${smallest_speed} est vérouillée !`
            }
        }

        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()

    } else if (vtext.startsWith('hunt sanity') || vtext.startsWith('sanity') || vtext.startsWith('santé mentale') || vtext.startsWith('seuil de chasse')) {
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized sanity command")
        running_log[cur_idx]["Type"] = "sanity"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('hunt sanity', "").replace('sanity', "").replace('santé mentale', "").replace('seuil de chasse', "").trim()
        domovoi_msg += "seuil de chasse marqué "

        var smallest_sanity = "tard"
        var smallest_val = 100
        var vvalue = 1


        if (vtext.startsWith("not ") || vtext.startsWith("knot ") || vtext.startsWith('pas ') || vtext.startsWith('par ')) {
            vtext = vtext.replace('not ', "").replace('knot ', "").replace('pas ', "").replace('par ', "").trim()
            vvalue = 0
            domovoi_msg += "pas "
        } else if (vtext.startsWith("undo ") || vtext.startsWith("undue ") || vtext.startsWith("on do ") || vtext.startsWith("on due ") || vtext.startsWith("clear") || vtext.startsWith("annuler ") || vtext.startsWith("annulée ") || vtext.startsWith("effacer ")) {
            vtext = vtext.replace('undo ', "").replace('undue ', "").replace("on do ", "").replace("on due ", "").replace("clear ", "").replace("annuler ", "").replace("annulée ", "").replace("effacer", "").trim()
            vvalue = 0
            domovoi_msg = "annulé "
        }

        // Common replacements for sanity
        var prevtext = vtext;
        for (const [key, value] of Object.entries(ZNLANG['sanity'])) {
            for (var i = 0; i < value.length; i++) {
                if (vtext.startsWith(value[i])) {
                    vtext = key
                }
            }
        }

        for (var i = 0; i < Object.keys(all_sanity).length; i++) {
            var leven_val = levenshtein_distance(Object.values(all_sanity)[i].toLowerCase(), vtext)
            if (leven_val < smallest_val) {
                smallest_val = leven_val
                smallest_sanity = Object.values(all_sanity)[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_sanity}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_sanity}`
        domovoi_msg += smallest_sanity.replace("Average", "Normal")

        if (!$(document.getElementById(rev(all_sanity,smallest_sanity)).querySelector("#checkbox")).hasClass("block")) {
            while (vvalue != {
                    "good": 1,
                    "neutral": 0
                } [document.getElementById(rev(all_sanity,smallest_sanity)).querySelector("#checkbox").classList[0]]) {
                dualstate(document.getElementById(rev(all_sanity,smallest_sanity)), false, true);
            }
        } else {
            domovoi_msg = `La santé mentale ${smallest_sanity} est vérouillée !`
        }

        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()

    } else if (vtext.startsWith('timer') || vtext.startsWith('minuteur')) {
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized timer command")
        running_log[cur_idx]["Type"] = "timer"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('timer', "").replace('minuteur', "").trim()

        if (vtext == "start") {
            domovoi_msg += "lancement du minuteur d'aveuglement"
            toggle_timer(true, false)
            send_timer(true, false)
        } else {
            domovoi_msg += "arrêt du minuteur d'aveuglement"
            toggle_timer(false, true)
            send_timer(false, true)
        }


        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    } else if (vtext.startsWith('cooldown') || vtext.startsWith('cool down') || vtext.startsWith('recharge') || vtext.startsWith('rechargement')) {
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized cooldown command")
        running_log[cur_idx]["Type"] = "cooldown"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('cooldown', "").replace('cool down', "").replace('recharge', "").replace('rechargement', "").trim()

        if (vtext == "start") {
            domovoi_msg += "lacement du rechargement de la chasse"
            toggle_cooldown_timer(true, false)
            send_cooldown_timer(true, false)
        } else {
            domovoi_msg += "arrêt du rechargement de la chasse"
            toggle_cooldown_timer(false, true)
            send_cooldown_timer(false, true)
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    } else if (vtext.startsWith('number of evidence') || vtext.startsWith('difficulty') || vtext.startsWith('nombre de preuves') || vtext.startsWith('difficulté')) {
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized evidence set command")
        running_log[cur_idx]["Type"] = "evidence set"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('number of evidence', "").replace('difficulty', "").replace('nombre de preuves', "").replace('difficulté', "").trim()
        domovoi_msg += "Réglage du nombre de preuves sur "
        vtext = vtext.replace('three', '3').replace('trois', '3')
        vtext = vtext.replace('two', '2').replace('to', '2').replace('deux', '2').replace('de', '2')
        vtext = vtext.replace('one', '1').replace('un', '1')
        vtext = vtext.replace('zero', '0').replace('zéro', '0')

        var smallest_num = 3
        var smallest_val = 100
        var prev_value = document.getElementById("num_evidence").value
        var all_difficulty = ['0', '1', '2', '3']

        for (var i = 0; i < all_difficulty.length; i++) {
            var leven_val = levenshtein_distance(all_difficulty[i], vtext)
            if (leven_val < smallest_val) {
                smallest_val = leven_val
                smallest_num = all_difficulty[i]
            }
        }
        domovoi_msg += smallest_num

        document.getElementById("num_evidence").value = smallest_num ?? 3
        if (prev_value != smallest_num) {
            filter()
            flashMode()
            saveSettings()
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    } else if (vtext.startsWith('show tools') || vtext.startsWith('show filters') || vtext.startsWith('voir outils') || vtext.startsWith('voir filtres') || vtext.startsWith('afficher outils') || vtext.startsWith('afficher filtres')) {
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized filter/tool command")
        running_log[cur_idx]["Type"] = "filter/tool"
        console.log(`Heard '${vtext}'`)
        domovoi_msg += "menu basculé"

        toggleFilterTools()

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    } else if (vtext.startsWith('show maps') || vtext.startsWith('show map') || vtext.startsWith('voir carte') || vtext.startsWith('montrer carte') || vtext.startsWith('afficher carte')) {
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized map command")
        running_log[cur_idx]["Type"] = "maps"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('show maps', "").replace('show map', "").replace('voir carte', "").replace('montrer carte', "").trim()
        domovoi_msg = "affichage de la carte"

        var smallest_map = "tanglewood"
        var smallest_val = 100

        if (vtext != "") {

            // Common replacements for maps
            var prevtext = vtext;
            for (const [key, value] of Object.entries(ZNLANG['maps'])) {
                for (var i = 0; i < value.length; i++) {
                    if (vtext.includes(value[i])) {
                        vtext = vtext.replace(value[i], key)
                    }
                }
            }

            var maps = document.getElementsByClassName("maps_button")

            for (var i = 0; i < maps.length; i++) {
                var leven_val = levenshtein_distance(maps[i].id.toLowerCase(), vtext)
                if (leven_val < smallest_val) {
                    smallest_val = leven_val
                    smallest_map = maps[i].id
                }
            }
            console.log(`${prevtext} >> ${vtext} >> ${smallest_map}`)
            running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_map}`
            domovoi_msg += `: ${smallest_map}`
        }

        changeMap(document.getElementById(smallest_map), all_maps[smallest_map])
        showMaps(true, false)

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    } else if (vtext.startsWith('close maps') || vtext.startsWith('close map') || vtext.startsWith('hide maps') || vtext.startsWith('hide map') || vtext.startsWith('cacher carte') || vtext.startsWith('masquer carte') || vtext.startsWith('fermer carte')) {
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized map command")
        running_log[cur_idx]["Type"] = "maps"
        console.log(`Heard '${vtext}'`)
        domovoi_msg = "fermeture de la carte"

        showMaps(false, true)

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    } else if (vtext.startsWith('reset cheat sheet') || vtext.startsWith('reset journal') || vtext.startsWith('réinitialiser journal')) {
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized reset command")
        console.log(`Heard '${vtext}'`)
        if (Object.keys(discord_user).length > 0) {
            if (!hasSelected()) {
                $("#reset").removeClass("standard_reset")
                $("#reset").addClass("reset_pulse")
                $("#reset").html("Aucune entité sélectionnée !<div class='reset_note'>(dites 'forcer réinitialisation' pour sauvegarder et réinitialiser)</div>")
                $("#reset").prop("onclick", null)
                $("#reset").prop("ondblclick", "reset()")
                reset_voice_status()
            } else {
                reset()
            }
        } else {
            reset()
        }
    } else if (vtext.startsWith('force reset') || vtext.startsWith('forcer réinitialisation')) {
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized reset command")
        console.log(`Heard '${vtext}'`)
        reset()
    } else if (vtext.startsWith('stop listening') || vtext.startsWith('arrêter écoute') || vtext.startsWith('arrêter commande vocale')) {
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized stop listening command")
        console.log(`Heard '${vtext}'`)
        stop_voice()
    } else if (
        vtext.startsWith("hello domo") || vtext.startsWith("hello domovoi") || vtext.startsWith("hello zero") ||
        vtext.startsWith("hi domo") || vtext.startsWith("hi domovoi") || vtext.startsWith("hi zero") || vtext.startsWith("bonjour domo") || vtext.startsWith("bonjour domovoi") || vtext.startsWith("bonjour zero") ||
        vtext.startsWith("salut domo") || vtext.startsWith("salut domovoi") || vtext.startsWith("salut zero")
    ) {
        if (Object.keys(discord_user).length > 0) {
            domovoi_heard(`bonjour ${discord_user['username']}!`)
        } else {
            domovoi_heard("bonjour !")
        }

        reset_voice_status()
    } else if (
        vtext.startsWith("move domo") || vtext.startsWith("move domovoi") || vtext.startsWith("move zero") ||
        vtext.startsWith("domo move") || vtext.startsWith("domovoi move") || vtext.startsWith("zero move") || vtext.startsWith("déplacer domo") || vtext.startsWith("déplacer domovoi") || vtext.startsWith("déplacer zero")
    ) {
        if (user_settings['domo_side'] == 0) {
            $("#domovoi").addClass("domovoi-flip")
            $("#domovoi-img").addClass("domovoi-img-flip")
        } else {
            $("#domovoi").removeClass("domovoi-flip")
            $("#domovoi-img").removeClass("domovoi-img-flip")
        }
        saveSettings()

        reset_voice_status()
    } else {
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-not-recognized.png)"
        domovoi_not_heard()
        reset_voice_status()
    }


}

if (("webkitSpeechRecognition" in window || "speechRecognition" in window) && !navigator.userAgent.toLowerCase().match(/firefox|fxios|opr/) && !('brave' in navigator)) {
    let speechRecognition = new webkitSpeechRecognition() || new speechRecognition();
    let stop_listen = true

    speechRecognition.continuous = false;
    speechRecognition.interimResults = false;
    speechRecognition.lang = 'fr-FR';

    speechRecognition.onend = () => {
        if (!stop_listen) {
            speechRecognition.start(auto = true);
        }
    }

    speechRecognition.onspeechstart = () => {
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-listening.png)"
    }

    speechRecognition.onerror = (error) => {
        if (error.error != "no-speech")
            console.log(error)
    }

    speechRecognition.onresult = (event) => {
        let final_transcript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                final_transcript = event.results[i][0].transcript;
            }
        }

        final_transcript = final_transcript.replace(/[.,;:-]/g, '')
        parse_speech(final_transcript);
    };

    function start_voice(auto = false) {
        stop_listen = false
        if (!auto) {
            document.getElementById("start_voice").disabled = true
            document.getElementById("stop_voice").disabled = false
            document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic.png)";
            document.getElementById("voice_recognition_status").className = "pulse_animation"
            document.getElementById("voice_recognition_status").style.display = "block"
            $("#domovoi").show()
            setCookie("voice_recognition_on", true, 0.0833)
        }
        speechRecognition.start();
    }

    function stop_voice() {
        stop_listen = true
        document.getElementById("start_voice").disabled = false
        document.getElementById("stop_voice").disabled = true
        document.getElementById("voice_recognition_status").style.display = "none"
        setCookie("voice_recognition_on", false, -1)
        $("#domovoi").hide()
        speechRecognition.stop();
    }

} else {
    document.getElementById("start_voice").disabled = true
    document.getElementById("stop_voice").disabled = true
    document.getElementById("start_voice").style.display = "none"
    document.getElementById("stop_voice").style.display = "none"
    document.getElementById("voice_recognition_note").innerHTML = "Navigateur non compatible"
    console.log("Speech Recognition Not Available");
}
