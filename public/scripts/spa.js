const app = {
    pages: [],
    show: new Event('show'),
    init: function () {
        app.pages = document.querySelectorAll('.page');
        app.pages.forEach((pg) => {
            pg.addEventListener('show', app.pageShown);
        })

        document.querySelectorAll('.nav-link').forEach((link) => {
            link.addEventListener('click', app.nav);
        })
        // history.replaceState({}, 'Home', '#home');
        let hashFilter = location.hash;
        let hash;
        let name;
        const matchedArray = hashFilter.match(/.*?[?!.]/g);
        if (matchedArray != null) {
            matchedArray[0] = matchedArray[0].substring(0, matchedArray[0].length - 1);
            name = matchedArray[0].substring(1, matchedArray[0].length);
            console.log(matchedArray[0]);
            hash = matchedArray[0];
        } else {
            hash = location.hash
            name = location.hash.replace('#', '');
        }
        console.log(hash);
        console.log(name);
        if (name == '') {
            name = 'home';
            hash = '#home';
        }
        document.getElementById(name).classList.add('active');
        history.replaceState({}, name, hash);
        window.addEventListener('popstate', app.poppin);
        document.getElementById(name).dispatchEvent(app.show);
    },
    nav: function (ev) {
        ev.preventDefault();
        let currentPage = ev.target.getAttribute('data-target');
        document.querySelector('.active').classList.remove('active');
        document.getElementById(currentPage).classList.add('active');
        console.log(currentPage)

        const params = new URLSearchParams(location.search);
        params.set('test', 123);
        params.set('cheese', 'yummy');
        history.pushState({}, currentPage, `?${params.toString()}`+`#${currentPage}` );
        document.getElementById(currentPage).dispatchEvent(app.show);
    },
    pageShown: function (ev) {
        console.log('Page', ev.target.id, 'just shown');
        let h1 = ev.target.querySelector('h1');
        h1.classList.add('big')
        setTimeout((h) => {
            h.classList.remove('big');
        }, 1200, h1);
        var url_string = window.location.href;
        console.log('query string ' + url_string);
        var url = new URL(url_string);
        console.log('query string ' + url);
        var c = url.searchParams.get("test");
        console.log('query string ' + c);
        switch (ev.target.id) {
            case 'home':
                console.log('Home page switch');
                break;
            case 'list':
                console.log('List page switch');
                break;
            case 'detail':
                console.log('Detail page switch');
                // expected output: "Mangoes and papayas are $2.79 a pound."
                break;
            default:
                console.log(`No page`);
        }
    },
    poppin: function (ev) {
        console.log(location.hash, 'popstate event');
        let hashFilter = location.hash;
        let hash;
        const matchedArray = hashFilter.match(/.*?[?!.]/g);
        if (matchedArray != null) {
            matchedArray[0] = matchedArray[0].substring(1, matchedArray[0].length - 1);
            console.log(matchedArray[0]);
            hash = matchedArray[0];
        } else {
            hash = location.hash.replace('#', '');
        }


        // let hash = location.hash.replace('#', '');
        document.querySelector('.active').classList.remove('active');
        document.getElementById(hash).classList.add('active');
        console.log(hash)
        //history.pushState({}, currentPage, `#${currentPage}`);
        document.getElementById(hash).dispatchEvent(app.show);
    }
}

document.addEventListener('DOMContentLoaded', app.init);