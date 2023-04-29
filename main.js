$(document).ready(function () {

    $('#searchButton').on('click', searchCards);

    window.reportList = [];
    let coinsObjects = [];
    let cards = '';

    let reportListReplica2;//this variable will replace report list if the user decided to save changes

    let loadingHome = $('#loadingHome');

    $(document).ajaxStart(function () {
        loadingHome.show();
    });
    $(document).ajaxStop(function () {
        loadingHome.hide();
    })

    $.ajax({
        url: "https://api.coingecko.com/api/v3/coins/",

        success: data => {
            $(data).each(function (index) {
                let coinToAdd = {};
                coinToAdd['symbol'] = this.symbol;
                coinToAdd['name'] = this.name;
                coinToAdd['id'] = this.id;
                coinsObjects[index] = coinToAdd;

                cards += `
        <div class="card myCard" id='${coinToAdd['id']}'>
  <div class="card-body">
  <h5 class="card-title">${coinToAdd['name']}</h5>
  <h6 class="card-subtitle mb-2 text-muted">${coinToAdd['symbol']}</h6>
 
  <label class="switch">
  <input type="checkbox"  class='reportSwitch' >
  <span class="slider round add" id='slider${index}' is_clicked = 'false'></span>
</label>
<br><br>
<p>
  <a class="btn btn-success info" isClicked='false' data-toggle="collapse" id="${index}" href="#collapseExample${index}" role="button" aria-expanded="false" aria-controls="collapseExample">
    More Info
  </a>

</p>
<div class="collapse" id="collapseExample${index}">
  <div class="card card-body" id="cardInfo${index}">
  <div class="myLoading" id="loading${index}" style="display:none"><img src="Spinner-1s-200px.gif"></div>
  </div>
</div>

  </div>
</div>
        `
            })
            const header = `<div id="coinsHeader"><h6 id="searchCoinsGoHere">${coinsObjects.length} coins available (turn toggle on to view stats)</h6></div>`

            $('#homeHeader').append(header);
            $('#cardsGoHere').append(cards);

            $(document).ajaxComplete(function (event, xhr, settings) {
                if (settings.url === "https://api.coingecko.com/api/v3/coins/") {
                    $('.info').on('click', getInfo);

                    $('.add').on('click', addToReports);

                    $('#showReport').on('click', showReport)
                }
            })}
    })
    //this function will add or remove item from the report list
    function addToReports() {

        const detailsId = ($(this).attr('id')).slice(6);
        const coinName = coinsObjects[detailsId];
        //This will make sure that the coin will be aded only if the switch is turned on

        if (this.getAttribute('is_clicked') == 'false') {

            reportList.push(coinName);

            this.setAttribute('is_clicked', 'true');

            if (reportList.length > 5) {

                $('#exampleModalLabel').html(`Oops! It seems that you've picked too many coins. Make some changes:`);
                //this replica will be used in case the user decided to make a replacment in the coins report list
                reportListReplica2 = JSON.parse(JSON.stringify(reportList));

                //here a modal will jump with the current list
                //this line will present to the user the coins that he have picked, and offer him to delete one or more, or none

                let htmlToModalWindow = ``;

                for (let i = 0; i < (reportList.length - 1); i++) {
                    htmlToModalWindow +=
                        `
                    <tr>
                    <td><div>${reportList[i].name}</div></td>
                    <td><button type="button" class="btn btn-danger xButton">X</button></td>
                    </tr>
                    `
                }

                $('.modal-body').html(
                    `<table>${htmlToModalWindow}</table>`
                );

                $(document).off('click').on('click', function (e) {
                    if (e.target.classList.contains('modal') && e.target.classList.contains('fade')) {
                        cancelModal(e);
                    }
                })

                $('#saveChanges').off('click').on('click', saveChanges);
                $('#closeButton').off('click').on('click', cancelModal);
                $('.xButton').off('click').on('click', deleteFromReport)
                $('#cancelButton').off('click').on('click', cancelModal);
                $('#modalButton').trigger('click');
            }
        }
        else {
            const coinToRemoveIndex = reportList.indexOf(coinName);
            reportList.splice(coinToRemoveIndex, 1);

            this.setAttribute('is_clicked', 'false')

            reportListReplica2 = JSON.parse(JSON.stringify(reportList));

        }
    }
    function deleteFromReport() {

        const coinToRemove = $(this).parent().prev('td').find('div').html();

        //this will replace the new coin with one that the user will choose. should replace only if expression is true.
        if (reportListReplica2.length == 6) {
            //finding the right coin to delete
            reportListReplica2.find((reportItems, i) => {
                if (reportItems.name === coinToRemove) {
                    //the coin to add will be the last coin the user has pressed
                    const coinToAdd = reportListReplica2[5];
                    reportListReplica2[i] = coinToAdd;
                    //The removal of the coin from the end of the array
                    reportListReplica2.pop();
                    //visual removal of the coin from the modal window
                    $(this).parent().prev('td').find('div').fadeOut(function () {
                        //visual replacemnt of the new coin
                        $(this).parent().prev('td').html(`<div>${reportListReplica2[i].name}</div>`)
                    }.bind(this));

                    return true; // stop searching
                }
            })
        }
        //this will delete the item from the report list with no replacement
        else {
            reportListReplica2.find((reportItems, i) => {
                if (reportItems.name === coinToRemove) {
                    reportListReplica2.splice(i, 1)
                    $(this).parent().parent().fadeOut();
                    return true;
                }})
        }
    }

    //This function will return numbers with a comma in the right place
    function separator(numb) {
        var str = numb.toString().split(".");
        str[0] = str[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return str.join(".");
    }

    //this will get additional information with API call based on the coin ID
    function getInfo() {

        let isClicked = this.getAttribute('isclicked');

        //this will make sure that the function will run only if the more info button hasnt been pressed yet
        if (isClicked === 'false') {
            this.setAttribute('isclicked', 'true');

            //this variable will get the coin name that the more info button is under. Used for session storage
            let coinName = $(this).parent().parent().find('h5').html();
            let usdValue;
            let ilsValue;
            let eurValue;
            let coinImage;

            if (sessionStorage.getItem(`${coinName}`) == null) {
                //Used to activate loading progress bar
                let thisId = this.id;
                let x = $(this).parent().parent().find(`#loading${thisId}`);

                $(document).ajaxStart(function () {

                    x.show();
                });

                $(document).ajaxStop(function () {
                    x.hide();
                });
                coindId = coinsObjects[this.id].id;

                $.ajax({
                    url: `https://api.coingecko.com/api/v3/coins/${coindId}`,

                    success: data => {
                        usdValue = separator(data.market_data.current_price.usd);
                        eurValue = separator(data.market_data.current_price.eur);
                        ilsValue = separator(data.market_data.current_price.ils);
                        coinImage = data.image.small;
                        const infoToStore =
                        {
                            USD: `${usdValue}`,
                            EUR: `${eurValue}`,
                            ILS: `${ilsValue}`,
                            IMG: `${coinImage}`

                        }
                            ;
                        sessionStorage.setItem(`${coinName}`, `${JSON.stringify(infoToStore)}`);

                        //this will delete item from session storage after 2 minutes (now 10 seconds only for code build)
                        setTimeout(() => {
                            sessionStorage.removeItem(`${coinName}`);
                        }, 120000)
                        $(`#cardInfo${this.id}`).html(
                        `
                        USD: ${usdValue}$</br>
                        EUR: ${eurValue}\u20AC</br>
                        ILS: ${ilsValue}\u20AA </br> 
                        <img src="${coinImage}">
                        `
                        )},
                    error: () => {
                        alert('Could not get DATA. Please try again.')
                    }})
            }

            //this code will fetch the data in session storage in case that the coin is allready exist
            else {
                const coinData = JSON.parse(sessionStorage.getItem(`${coinName}`));
                usdValue = coinData.USD;
                eurValue = coinData.EUR;
                ilsValue = coinData.ILS;
                imgValue = coinData.IMG;
                $(`#cardInfo${this.id}`).html(
                    `
                    USD: ${usdValue}$<br>
                    EUR: ${eurValue}\u20AC<br>
                    ILS: ${ilsValue}\u20AA <br> 
                    <img src="${imgValue}">
                    `
                )
            };

        }
        else {
            this.setAttribute('isclicked', 'false');
        }
    }

    //this function will run if the user decide to save changes in the report list
    function saveChanges(e) {
        if (reportListReplica2.length == 6) {

            const coinToCancelSwitch = reportList[5].name;

            coinsObjects.find((coin, i) => {
                if (coin.name === coinToCancelSwitch) {
                    $(`#slider${i}`).trigger('click');
                    $('#cancelButton').trigger('click');

                    return true;
                }
            })
        }

        //this will save changes in case that the user did some changes in the modal window
        else {

            const replica2id = [];
            const reportId = [];

            //replica2 id's

            $(reportListReplica2).each(function (i) {
                replica2id.push(this.id);
            })

            //report list id's

            $(reportList).each(function (i) {
                reportId.push(this.id);
            });
            //this will check which id's appear in the replica2 but not in the report list
            $(reportId).each(function () {
                if (replica2id.indexOf(this.toString()) < 0) {
                    $(`#${this.toString()}`).find('.slider').trigger('click');
                }
            })
            $('#cancelButton').trigger('click');
            return true;
        }
    }
    //this function will run if the user decide to cancel changes that has made in the report list
    function cancelModal(e) {

        if (e.originalEvent instanceof PointerEvent) {
            if (reportList.length == 6) {
                const coinToCancelSwitch = reportList[5].name;
                coinsObjects.find((coin, i) => {
                    if (coin.name === coinToCancelSwitch) {
                        $(`#slider${i}`).trigger('click');
                        // $('#cancelButton').trigger('click');
                        return true;
                    }
                })
            }
        }
    }

    function searchCards(e) {
        if ($('#mySearch').val().trim() == '') {
            $('#searchCoinsGoHere').html(`${coinsObjects.length} coins available (turn toggle on to view stats)`);

            $('.myCard').each(function () {
                $(this).toggle(true);
            })
        }
        else {
            const searchValue = $('#mySearch').val().toLowerCase();
            $('.card-subtitle').filter(function () {

                $(this).parent().parent().toggle(
                    $(this).text().toLowerCase() === (searchValue)
                )
            });

            let cardDisplayed = $('.myCard:visible').length;
            $('#searchCoinsGoHere').html(`${cardDisplayed} coins available (turn toggle on to view stats)`)
        }
    }

    function showReport() {
        $('#exampleModalLabel').html('Coins in report:')

        //this replica will be used in case the user decided to make a replacment in the coins report list
        reportListReplica2 = JSON.parse(JSON.stringify(reportList));

        //here a modal will jump with the current list
        //this line will present to the user the coins that he have picked, and offer him to delete one or more, or none
        let htmlToModalWindow = ``;

        for (let i = 0; i < (reportList.length); i++) {
            htmlToModalWindow +=
                `
                    <tr>
                    <td><div>${reportList[i].name}</div></td>
                    <td><button type="button" class="btn btn-danger xButton">X</button></td>
                    </tr>
                    `

        }

        $('.modal-body').html(
            `<table>${htmlToModalWindow}</table>`
        );

        $(document).off('click').on('click', function (e) {
            if (e.target.classList.contains('modal') && e.target.classList.contains('fade')) {
            }})

        $('#saveChanges').off('click').on('click', saveChanges);
        $('.xButton').off('click').on('click', deleteFromReport)
        $('#modalButton').trigger('click');
    }}
)