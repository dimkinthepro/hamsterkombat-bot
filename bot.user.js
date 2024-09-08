// ==UserScript==
// @name         Hamster kombat farm bot
// @namespace    dimkinthepro-hamster-kombat-game-bot
// @version      2024-08-04
// @description  Farm bot for hamsterkombat telegram game app
// @author       https://github.com/dimkinthepro
// @match        https://hamsterkombatgame.io/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

window.addEventListener('load', function() {
    'use strict';

    const tapUrl = 'https://api.hamsterkombatgame.io/clicker/tap';
    const buyBoostUrl = 'https://api.hamsterkombatgame.io/clicker/buy-boost';
    const boostToBuyUrl = 'https://api.hamsterkombatgame.io/clicker/boosts-for-buy';
    const dailyRewardUrl = 'https://api.hamsterkombatgame.io/clicker/check-task';
    const claimDailyCipherUrl = 'https://api.hamsterkombatgame.io/clicker/claim-daily-cipher';
    let currentLevel = 1;
    let startedCoins = 0;
    let token = null;
    let dailyCipher = null;

    function getRandom(minSeconds, maxSeconds, isMilisec = true) {
        let seconds = Math.floor(Math.random() * (maxSeconds - minSeconds) + minSeconds);

        return isMilisec ? seconds * 1000 : seconds;
    }

    function updateFarmedCount(coins) {
        if (startedCoins === 0) {
            startedCoins = coins;
        }

        const farmedCoins = coins - startedCoins;

        if (farmedCoins > 0) {
            const text = document.querySelector('#hamster-bot-text');
            text.innerHTML = 'Farmed coins: ' + farmedCoins;
        }
    }

    function sendRequest(url, data) {
        return fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json;charset=utf-8'
            }
        })
            .then((response) => response.json())
            .then((data) => {
                return data;
            })
            .catch((error) => {
                console.error('HamsterKombat bot error', error)
            });
    }

    function addLogo() {
        const block = document.createElement('div');
        const blockHeader = document.createElement('p');
        const blockText = document.createElement('p');

        blockText.id = 'hamster-bot-text'
        blockHeader.innerHTML = 'HamsterKombat bot INJECTED!';
        block.style.cssText = 'width:100%;height:auto;background:#000;padding:10px;text-align:center;';
        block.appendChild(blockHeader);
        block.appendChild(blockText);
        document.body.insertBefore(block, document.body.firstChild);
    }

    function tapByTouch() {
        const button = document.querySelector('.user-tap-button');
        button.dispatchEvent(new PointerEvent('pointerup'));
    }

    function closePopups() {
        const dailyRewardButton = document.querySelector('.daily-reward-bottom-button .button');
        if (dailyRewardButton) {
            dailyRewardButton.click();
        }

        const button = document.querySelector('.bottom-sheet-button');
        if (button && !button.classList.contains('is-sticky')) {
            button.click();
        }
    }

    function getDailyCipher() {
        fetch('https://hamsterkombo.com', {method: "GET", mode: "cors"})
            .then((response) => response.text())
            .then((html) => {
                const doc = (new DOMParser()).parseFromString(html, 'text/html');
                const code = doc.querySelector('.contents .contents.font-poppins p span').getHTML();
                if (code && dailyCipher !== code) {
                    sendRequest(claimDailyCipherUrl, {
                        'cipher': code
                    })
                        .then((data) => {
                            dailyCipher = code;
                            console.info('HamsterKombat bot: New daily cipher climed: "' + code + '"');
                        })
                }
            });

        const timeout = getRandom(3600, 10000);
        console.info('HamsterKombat bot: Daily cipher request. Next request in ' + parseInt(timeout/1000/60) + ' minutes.');
        setTimeout(getDailyCipher, timeout);
    }

    function buyBoost() {
        sendRequest(boostToBuyUrl, {})
            .then((data) => {
                const boosts = data.boostsForBuy.filter((el) => el.id === 'BoostFullAvailableTaps');
                const boost = boosts[0] || null;
                if (boost == null) {
                    console.error('HamsterKombat bot ERROR: Boosts not found');

                    return;
                }

                if (boost.cooldownSeconds === 0) {
                    sendRequest(buyBoostUrl, {
                        'boostId': 'BoostFullAvailableTaps',
                        'timestamp': Date.now()
                    })
                        .then((data) => {
                            tapByTouch();
                        })
                }
            });

        const timeout = getRandom(300, 3600);
        console.info('HamsterKombat bot: Buy boost request. Next request in ' + parseInt(timeout/1000/60) + ' minutes.');
        setTimeout(buyBoost, timeout);
    }

    function dailyReward() {
        sendRequest(dailyRewardUrl, {});
        const timeout = getRandom(3600 * 24, 3600 * 25);
        console.info('HamsterKombat bot: Daily reward requested. Next request in ' + parseInt(timeout/1000/60/60) + ' hours.');

        setTimeout(dailyReward, timeout);
    }

    function farm() {
        const energy = document.querySelector('.user-tap-energy > p');

        if (energy) {
            const energyString = energy.innerText
            if (!energyString) {
                console.error('HamsterKombat bot ERROR: Energy not found');

                return;
            }

            let currentEnergy = Number(energyString.split('/')[0]);
            let maxEnergy = Number(energyString.split('/')[1]);

            if (currentEnergy > 100) {
                sendRequest(tapUrl, {
                    'count': parseInt(currentEnergy / currentLevel),
                    'availableTaps': getRandom(1, 15, false),
                    'timestamp': Date.now()
                }).then((data) => {
                    currentLevel = parseInt(data.clickerUser.level || 1);
                    updateFarmedCount(parseInt(data.clickerUser.balanceCoins));
                    tapByTouch();
                });
            }
        }

        closePopups();
        const timeout = getRandom(30, 60);
        console.info('HamsterKombat bot: Farm request. Next request in ' + parseInt(timeout/1000) + ' seconds.');
        setTimeout(farm, timeout);
    }

    function run() {
        token = localStorage.getItem('authToken');
        if (!token || token == null) {
            console.error('HamsterKombat bot ERROR: Token not found');

            return;
        }

        farm();
        buyBoost();
        dailyReward();
        getDailyCipher();
        addLogo();
    }

    const originslIndexOf = Array.prototype.indexOf;
    Array.prototype.indexOf = function (...args) {
        if (JSON.stringify(this) === JSON.stringify(['android', 'android_x', 'ios'])) {
            setTimeout(() => {
                Array.prototype.indexOf = originslIndexOf;
                run();
                console.info('HamsterKombat bot INJECTED!');
            })

            return 0;
        }

        return originslIndexOf.apply(this, args);
    }
}, false);
