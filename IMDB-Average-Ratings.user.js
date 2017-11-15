// ==UserScript==
// @name         IMDB - Average Ratings
// @namespace    https://github.com/LenAnderson/
// @downloadURL  https://github.com/LenAnderson/IMDB-Average-Ratings/raw/master/IMDB-Average-Ratings.user.js
// @version      0.1
// @author       LenAnderson
// @match        http://www.imdb.com/name/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.1/Chart.min.js
// ==/UserScript==

(function() {
    'use strict';

    let $ = document.querySelector.bind(document);
    let $$ = document.querySelectorAll.bind(document);

    function get(url) {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.addEventListener('load', ()=>{resolve(xhr.responseText);});
            xhr.addEventListener('error', ()=>{resolve();});
            xhr.send();
        });
    }

    let spinner = document.createElement('div');
    spinner.style.backgroundImage = 'url(http://ia.media-imdb.com/images/G/01/imdb/images/favorite_theater/spinner-3099941772._CB514892126_.gif)';
    spinner.style.backgroundRepeat = 'no-repeat';
    spinner.style.backgroundPosition = 'center';
    spinner.style.height = '20px';
    spinner.title = 'Loading ratings...';
    $('#filmo-head-actress').appendChild(spinner);

    Promise.all([].filter.call($$('#filmo-head-actress + .filmo-category-section > .filmo-row'), row => {
        return row.querySelector('.in_production') == null;
    }).map(row => {
        return get(row.querySelector('a').href).then(responseText=>{
            if (responseText == null) return;
            let html = document.createElement('div');
            html.innerHTML = responseText;
            let rating = html.querySelector('.imdbRating [itemprop="ratingValue"]');
            rating = rating==null ? null : rating.textContent * 1;
            return {
                year: row.querySelector('.year_column').textContent.trim().replace(/^[^\d]*(\d+).*$/, '$1')*1,
                title: row.querySelector('a').textContent,
                rating: rating
            };
        });
    })).then(movies => {
        movies = movies.filter(movie=>movie!=null&&movie.rating!=null).sort((a,b)=>{
            if (a.year > b.year) return 1;
            if (a.year < b.year) return -1;
            return 0;
        });
        let canvas = document.createElement('canvas');
        canvas.style.display = 'block';
        canvas.style.width = '600px';
        spinner.remove();
        $('#filmo-head-actress').appendChild(canvas);
        let context = canvas.getContext('2d');
        let chart = new Chart(context, {
            type: 'scatter',
            data: {
                datasets:[
                    {
                        label: 'Rating',
                        fill: false,
                        showLine: false,
                        backgroundColor: 'rgba(0,0,0,0)',
                        borderColor: 'rgba(50,50,50,0.8)',
                        pointBackgroundColor: 'rgba(50,50,50,0.8)',
                        data: movies.map(movie=>{return {x:movie.year, y:movie.rating, title:movie.title};})
                    },
                    {
                        label: 'Average Score',
                        fill: false,
                        showLine: true,
                        pointRadius: 0,
                        backgroundColor: 'rgba(0,0,0,0)',
                        borderColor: 'rgba(0,0,255,0.8)',
                        fillColor: 'rgba(0,0,0,0)',
                        data: Array.from(new Set(movies.map(movie=>movie.year))).map(year=>{return {x:year, y:movies.filter(movie=>movie.year==year).reduce((sum,cur)=>sum+cur.rating,0)/movies.filter(movie=>movie.year==year).length};})
                    }
                ]
            },
            options: {
                tooltips:{
                    callbacks: {
                        label:tooltipItem => movies[tooltipItem.index].title + ' (' + movies[tooltipItem.index].rating + ')'
                    }
                },
                scales: {
                    xAxes: [{
                        ticks: {
                            stepSize: 1,
                            min: movies[0].year-1,
                            max: movies[movies.length-1].year+1
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            min: 1,
                            max: 10
                        }
                    }]
                }
            }
        });
    }).catch(error => {
        console.warn(error);
    });
})();
