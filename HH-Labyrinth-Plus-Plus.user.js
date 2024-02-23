// ==UserScript==
// @name         HH Labyrinth++
// @version      0.6 
// @description  Upgrade Labyrinth with various features
// @author       -MM-
// @match        https://*.hentaiheroes.com/labyrinth.html*
// @match        https://*.hentaiheroes.com/labyrinth-pre-battle.html?id_opponent=*
// @match        https://*.hentaiheroes.com/labyrinth-battle.html?id_opponent=*
// @match        https://*.hentaiheroes.com/edit-labyrinth-team.html*
// @match        https://nutaku.haremheroes.com/labyrinth.html*
// @match        https://nutaku.haremheroes.com/labyrinth-pre-battle.html?id_opponent=*
// @match        https://nutaku.haremheroes.com/labyrinth-battle.html?id_opponent=*
// @match        https://nutaku.haremheroes.com/edit-labyrinth-team.html*
// @match        https://*.comixharem.com/labyrinth.html*
// @match        https://*.comixharem.com/labyrinth-pre-battle.html?id_opponent=*
// @match        https://*.comixharem.com/labyrinth-battle.html?id_opponent=*
// @match        https://*.comixharem.com/edit-labyrinth-team.html*
// @match        https://*.pornstarharem.com/labyrinth.html*
// @match        https://*.pornstarharem.com/labyrinth-pre-battle.html?id_opponent=*
// @match        https://*.pornstarharem.com/labyrinth-battle.html?id_opponent=*
// @match        https://*.pornstarharem.com/edit-labyrinth-team.html*
// @match        https://*.gayharem.com/labyrinth.html*
// @match        https://*.gayharem.com/labyrinth-pre-battle.html?id_opponent=*
// @match        https://*.gayharem.com/labyrinth-battle.html?id_opponent=*
// @match        https://*.gayharem.com/edit-labyrinth-team.html*
// @run-at       document-body
// @namespace    https://github.com/HH-GAME-MM/HH-Labyrinth-Plus-Plus
// @updateURL    https://github.com/HH-GAME-MM/HH-Labyrinth-Plus-Plus/raw/main/HH-Labyrinth-Plus-Plus.user.js
// @downloadURL  https://github.com/HH-GAME-MM/HH-Labyrinth-Plus-Plus/raw/main/HH-Labyrinth-Plus-Plus.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hentaiheroes.com
// @grant        GM_info
// ==/UserScript==

(function() {
    'use strict';
    /*global Hero,GT,opponent_fighter,hero_fighter,hero_page_popup,loadingAnimation,hh_ajax,Reward,HHPopupManager,objectivePopup,getSessionId,$*/

    const LS_KEY = 'HHLabyrinthPlusPlus_Config';

    //css
    switch(window.location.pathname)
    {
        case '/labyrinth.html': Labyrinth_css(); break;
        case '/labyrinth-pre-battle.html': PreBattle_css(); break;
        case '/labyrinth-battle.html': Battle_css(); break;
        case '/edit-labyrinth-team.html': EditTeam_css(); break;
    }

    if(document.readyState === 'complete') {
        DOMContentLoaded();
    } else {
        document.addEventListener('DOMContentLoaded', DOMContentLoaded);
    }

    function DOMContentLoaded()
    {
        switch(window.location.pathname)
        {
            case '/labyrinth.html': setTimeout(Labyrinth_run, 1); break;
            case '/labyrinth-pre-battle.html': setTimeout(PreBattle_run, 1); break;
            case '/edit-labyrinth-team.html': EditTeam_run(); break;
        }
    }

    function PreBattle_css()
    {
        let css = document.createElement('style');
        document.head.appendChild(css);

        //hide the Perform! button
        css.sheet.insertRule('#perform_opponent {display: none}');
    }

    function PreBattle_run()
    {
        //remove event listeners from middle container
        let container = document.querySelector('div.middle-container');
        container.setAttribute('style', 'text-align: center');
        container.parentNode.replaceChild(container.cloneNode(true), container);

        //button Go Back
        let btnBack = document.querySelector('#return_labyrinth');
        btnBack.addEventListener("click", () => {
            window.location.href = "/labyrinth.html"
        });

        //button Perform!
        let btnPerform = document.querySelector('#perform_opponent');
        btnPerform.setAttribute('style', 'display: inline-block');
        btnPerform.addEventListener("click", () => {
            KK_isTeamFull(false);
        });

        //button Perform and skip battle!
        let btnPerformAjax = btnPerform.cloneNode(true);
        btnPerformAjax.setAttribute('style', 'display: inline-block; margin-top: 2rem');
        btnPerformAjax.innerHTML = 'Perform and skip battle!';
        btnPerformAjax.addEventListener("click", () => {
            KK_isTeamFull(true);
        });
        btnPerform.after(btnPerformAjax);

        //KK Code modified with "if(skipFight) performAjax();"
        function KK_isTeamFull(skipFight)
        {
            var is_team_full = Object.keys(hero_fighter.team.girls).length == 7;
            if (is_team_full) {
                if(skipFight) performAjax(); //new code
                else window.location.href = "/labyrinth-battle.html?id_opponent=" + opponent_fighter.id_fighter + "&number_of_battles=1"
            } else {
                var partially_full_team_confirmation = {
                    confirm: {
                        title: "",
                        body: GT.design.labyrinth_partially_full_team,
                        buttons: {
                            yes: "OK",
                            no: GT.design.push_notif_no_thanks
                        }
                    },
                    no_close: true,
                    textAlign: "center"
                };
                HHPopupManager.show("confirmation_popup", partially_full_team_confirmation, function() {
                    if(skipFight) performAjax(); //new code
                    else window.location.href = "/labyrinth-battle.html?id_opponent=" + opponent_fighter.id_fighter + "&number_of_battles=1"
                })
            }
        }

        function performAjax()
        {
            //disable the buttons and remove the event listeners
            btnPerform.setAttribute('disabled', 'disabled');
            btnPerformAjax.setAttribute('disabled', 'disabled');
            const btnPerformClone = btnPerform.cloneNode(true);
            const btnPerformAjaxClone = btnPerformAjax.cloneNode(true);
            btnPerform.parentNode.replaceChild(btnPerformClone, btnPerform);
            btnPerformAjax.parentNode.replaceChild(btnPerformAjaxClone, btnPerformAjax);
            btnPerform = btnPerformClone;
            btnPerformAjax = btnPerformAjaxClone;

            loadingAnimation.start();

            //open the battle page first
            const nutakuSessionId = getSessionId();
            $.ajax({ url: "/labyrinth-battle.html?id_opponent=" + opponent_fighter.id_fighter + "&number_of_battles=1" + (nutakuSessionId !== null ? '&sess=' + nutakuSessionId : ''), success: function(data) {

                //change referer
                window.history.replaceState(null, '', "/labyrinth-battle.html?id_opponent=" + opponent_fighter.id_fighter + "&number_of_battles=1");

                let params = {
                    action: "do_battles_labyrinth",
                    id_opponent: opponent_fighter.id_fighter,
                    number_of_battles: "1"
                };
                hh_ajax(params, function(data) {
                    //change referer
                    window.history.replaceState(null, '', '/labyrinth-pre-battle.html?id_opponent=' + opponent_fighter.id_fighter);

                    loadingAnimation.stop();
                    Reward.handlePopup(data.rewards);
                    Hero.updates(data.hero_changes);
                    if(data.objective_points) {
                        data.rewards.objective_points = data.objective_points;
                        objectivePopup.show(data.rewards);
                    }
                })
            }});
        }
    }

    function EditTeam_css()
    {
        let css = document.createElement('style');
        document.head.appendChild(css);

        css.sheet.insertRule(`.change-team-panel button.pressedDown {
  box-shadow: none;
}`);
        css.sheet.insertRule(`div.change-team-panel .panel-title {
  font-size: 0.95rem;
  margin-bottom: 0;
  margin-top: -5px;
  height: 47px;
}`);
        css.sheet.insertRule(`div.change-team-panel .panel-body {
  height: 92% !important;
}`);
        css.sheet.insertRule(`div.change-team-panel .nicescroll-rails-vr {
  top: 6.6rem !important;
}`);
    }

    function EditTeam_run()
    {
        const mySquadNode = document.querySelector('div.change-team-panel .panel-title');
        const mySquadText = mySquadNode.innerText;
        const searchBtn = document.querySelector('#filter_girls');
        const btns = [createBtn(2), createBtn(1), createBtn(3)];
        let config = loadConfigFromLocalStorage();
        if(config.lastFilter !== 0) {
            setTimeout(() => { btns[indexToArrayIndex(config.lastFilter)].click(); }, 1);
        } else {
            updateMySquadText();
        }

        function updateMySquadText()
        {
            const allGirls = document.querySelectorAll('div.change-team-panel div.harem-panel-girls div.harem-girl-container');
            let counter = 0;
            allGirls.forEach((e) => { counter += (isHidden(e) ? 0 : 1) });
            mySquadNode.innerHTML = mySquadText + '<br>' + counter + ' / ' + allGirls.length + ' ' + getGirlText() + 's';
        }

        function indexToArrayIndex(index)
        {
            switch(index)
            {
                case 1: return 1;
                case 2: return 0;
                case 3: return 2;
            }
            return -1;
        }

        function createBtn(index)
        {
            let png = indexToArrayIndex(index) + 1;
            let style = (png === 3 ? 'float: right;' : 'float: right; margin-right: 10px;');

            let btn = document.createElement('button');
            btn.setAttribute('class', 'square_blue_btn');
            btn.setAttribute('style', style);
            btn.innerHTML = '<span class="search_open_icn" style="background-image: url(https://hh2.hh-content.com/pictures/misc/items_icons/' + png + '.png)"></span>';
            btn.addEventListener("click", () => {
                btnClicked(btn, index);
            });
            searchBtn.after(btn);

            return btn;
        }

        function btnClicked(btn, index)
        {
            if(btn.classList.contains('pressedDown')) {
                btn.classList.remove('pressedDown');
                index = 0;
            } else {
                btns.forEach((e) => e.classList.remove('pressedDown'));
                btn.classList.add('pressedDown');
            }
            document.querySelector('div.select-group.girl-class-filter div.selectric-items ul li[data-index="' + index + '"]').click();
            updateMySquadText();
            config.lastFilter = index;
            saveConfigToLocalStorage(config);
        }
    }

    function Battle_css()
    {
        let css = document.createElement('style');
        document.head.appendChild(css);

        //skip button perm visible
        css.sheet.insertRule('button#new-battle-skip-btn {display: block !important}');
    }

    function Labyrinth_css()
    {
        let css = document.createElement('style');
        document.head.appendChild(css);

        //shop items
        css.sheet.insertRule('#shop_tab_container .shop-items-list .shop-item {transform: scale(0.8);}');

        //shop girl
        css.sheet.insertRule('#shop_tab_container .shop-labyrinth-girl {height: auto !important; margin-left: 1rem !important;}');

        //hide the buy buttons as long as they don't have a confirmation box
        css.sheet.insertRule('button.blue_button_L.buy-item {display: none !important;}');
    }

    function Labyrinth_run()
    {
        //HH Labyrinth++ text
        let bottomSection = document.querySelector('.labyrinth-panel .labyrinth-container .bottom-section');
        let div = document.createElement('div');
        div.setAttribute('style', 'position: absolute;width: 260px;bottom: 0;left: -280px;font-size: 16px;box-shadow: 0 6px 12px rgba(0,0,0,.66),inset 0 0 50px rgba(102,32,52,.4);border-radius: 28px;border: 1px solid #f90;background-image: linear-gradient(to top,#7a3566 0,#412b4b 100%);text-align: center;');
        div.innerHTML = 'HH Labyrinth++ v' + GM_info.script.version + ' by <div style="display:inline;cursor:pointer" onclick="' + (window.location.hostname === 'www.hentaiheroes.com' ? 'hero_page_popup({id:4266159})' : 'window.open(\'https://www.hentaiheroes.com/hero/4266159/profile.html\', \'_blank\');') + '">-MM-</div>';
        bottomSection.appendChild(div);

        //shop mods
        new MutationObserver((mutations, observer) => {
            for(let i = 0; i < mutations.length; i++)
            {
                for(let j = 0; j < mutations[i].addedNodes.length; j++)
                {
                    if(mutations[i].addedNodes[j].className === 'shop-section')
                    {
                        for(let k = 0; k < mutations[i].addedNodes[j].childNodes.length; k++)
                        {
                            if(mutations[i].addedNodes[j].childNodes[k].className === 'shop-items-list')
                            {
                                //change style
                                mutations[i].addedNodes[j].childNodes[k].setAttribute('style', 'grid-template-columns: auto auto auto auto auto; overflow: hidden; outline: none; grid-column-gap: 0.7rem; height: 20rem !important;');

                                let buyButtons = mutations[i].addedNodes[j].childNodes[k].querySelectorAll('button.blue_button_L.buy-item');
                                for(let m = 0; m < buyButtons.length; m++)
                                {
                                    buyButtons[m].addEventListener("click", (event) => {

                                        if(!confirm('Would you like to buy this item for ' + event.currentTarget.querySelector('.price-container').innerText.trim() + ' coins?'))
                                        {
                                            //stop the click event so that it is not executed by Kinkoid's handler
                                            if (event.stopPropagation) {
                                                event.stopPropagation(); // W3C model
                                            } else {
                                                event.cancelBubble = true; // IE model
                                            }
                                        }
                                    });

                                    //show the buy button again
                                    buyButtons[m].setAttribute('style', 'display: inline-block !important');
                                }

                                return;
                            }
                        }
                    }
                }
            }
        }).observe(document.querySelector('#shop_tab_container'), { childList:true, subtree:true });
    }

    function loadConfigFromLocalStorage()
    {
        let json = localStorage.getItem(LS_KEY);
        let config = json != null ? JSON.parse(json) : { };

        //default config
        if(typeof config.lastFilter == 'undefined') config.lastFilter = 0;

        return config;
    }

    function saveConfigToLocalStorage(config)
    {
        localStorage.setItem(LS_KEY, JSON.stringify(config));
    }

    function getGirlText()
    {
        if(location.hostname.includes('gayharem')) return 'Boy';
        return 'Girl';
    }

    function isHidden(el)
    {
        return (el.offsetParent === null);
    }
})();
