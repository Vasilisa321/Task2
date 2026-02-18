Vue.component('card-form', {
    template: `
   <input>
 `,
    data() {
        return {
            name: null
        }
    }
})



let app = new Vue({
    el: '#app',
    data: {
        newCardTitle: '',
        cards: [],
        product: "Socks"
    },
    methods: {
        createCard() {
        }
    }
})
