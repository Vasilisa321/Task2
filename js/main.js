Vue.component('card-item', {
    props: ['card', 'column1Blocked'],
    template: `
        <div class="card" :class="{ 'blocked-card': blocked }">
            <div class="card-header">
                <h3>{{ card.title }}</h3>
                <button @click="deleteCard" class="delete-card-btn" title="Удалить карточку">×</button>
            </div>
            
            <div class="card-author">
                {{ card.author }}
            </div>
            
            <div v-if="blocked" class="blocked-indicator">
                Колонка заблокирована (2 колонка заполнена)
            </div>
            
            <div class="progress-bar" v-if="card.items.length">
                <div class="progress-fill" :style="{ width: progress + '%' }"></div>
                <span class="progress-text">{{ progress }}%</span>
            </div>
            
            <div class="card-items">
                <div v-for="item in card.items" :key="item.id" class="card-item">
                    <input 
                        type="checkbox" 
                        :checked="item.completed"
                        @change="toggleItem(item.id)"
                        :disabled="blocked"
                    >
                    <span :class="{ completed: item.completed }">{{ item.text }}</span>
                </div>
            </div>
            
            <div v-if="card.column === 3 && card.completedAt" class="completed-date">
                Завершено: {{ card.completedAt }}
            </div>
           
            <div class="add-item-form" v-if="card.items.length < 5 && card.column !== 3">
                <input 
                    type="text" 
                    v-model="newItemText" 
                    placeholder="Новый пункт"
                    @keyup.enter="addItem"
                    :disabled="blocked"
                >
                <button @click="addItem" :disabled="blocked">+</button>
            </div>
            
            <div class="card-footer">
                <small>Создано: {{ card.createdAt }}</small>
            </div>
            
            <div v-if="card.items.length >= 5" class="item-limit">
                Максимум пунктов (5)
            </div>
        </div>
    `,
    data() {
        return {
            newItemText: ''
        };
    },
    computed: {
        progress() {
            if (!this.card.items.length) return 0;
            const completed = this.card.items.filter(i => i.completed).length;
            return Math.round((completed / this.card.items.length) * 100);
        },
        blocked() {
            return this.card.column === 1 && this.column1Blocked;
        }
    },
    methods: {
        addItem() {
            if (!this.newItemText.trim()) return;
            if (this.card.items.length >= 5) return;

            const newItem = {
                id: Date.now() + Math.random(),
                text: this.newItemText,
                completed: false
            };

            const updatedCard = {
                ...this.card,
                items: [...this.card.items, newItem]
            };

            this.$emit('update-card', updatedCard);
            this.newItemText = '';
        },
        toggleItem(itemId) {
            if (this.blocked) return;

            const updatedItems = this.card.items.map(item => {
                if (item.id === itemId) {
                    return { ...item, completed: !item.completed };
                }
                return item;
            });

            const updatedCard = { ...this.card, items: updatedItems };
            this.$emit('update-card', updatedCard);
        },
        deleteCard() {
            if (confirm('Удалить карточку?')) {
                this.$emit('delete-card', this.card.id);
            }
        }
    }
});

new Vue({
    el: '#app',
    data: {
        newCardTitle: '',
        newCardAuthor: '',
        newItemText: '',
        tempItems: [],
        cards: [],
        column1Blocked: false
    },
    computed: {
        column1Cards() {
            return this.cards.filter(c => c.column === 1);
        },
        column2Cards() {
            return this.cards.filter(c => c.column === 2);
        },
        column3Cards() {
            return this.cards.filter(c => c.column === 3);
        },
        canCreateCard() {
            return this.column1Cards.length < 3;
        },
        isColumn2Full() {
            return this.column2Cards.length >= 5;
        }
    },
    watch: {
        cards: {
            handler() {
                this.checkMoveConditions();
                this.saveToLocalStorage();
            },
            deep: true
        }
    },
    methods: {
        formatDateTime(date) {
            return date.toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        formatDate(date) {
            return date.toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        },

        addTempItem() {
            if (!this.newItemText.trim()) {
                alert('Введите текст пункта!');
                return;
            }
            if (this.tempItems.length >= 5) {
                alert('Максимум 5 пунктов!');
                return;
            }

            this.tempItems.push({
                id: Date.now() + Math.random(),
                text: this.newItemText,
                completed: false
            });

            this.newItemText = '';
        },

        removeTempItem(itemId) {
            this.tempItems = this.tempItems.filter(item => item.id !== itemId);
        },

        createCard() {
            if (!this.newCardTitle.trim() || !this.newCardAuthor.trim()) {
                alert('Заполните заголовок и укажите ваше имя!');
                return;
            }
            if (!this.canCreateCard) return;

            if (this.tempItems.length < 3) {
                alert('Добавьте минимум 3 пункта!');
                return;
            }
            if (this.tempItems.length > 5) {
                alert('Максимум 5 пунктов!');
                return;
            }

            this.cards.push({
                id: Date.now(),
                title: this.newCardTitle,
                author: this.newCardAuthor,
                column: 1,
                items: [...this.tempItems],
                createdAt: this.formatDate(new Date())
            });

            this.newCardTitle = '';
            this.newCardAuthor = '';
            this.tempItems = [];
            this.newItemText = '';
        },

        updateCard(updatedCard) {
            const index = this.cards.findIndex(c => c.id === updatedCard.id);
            if (index !== -1) {
                this.$set(this.cards, index, updatedCard);
            }
        },

        deleteCard(cardId) {
            this.cards = this.cards.filter(card => card.id !== cardId);
            this.saveToLocalStorage();
        },

        checkMoveConditions() {
            if (this.isColumn2Full) {
                const hasCardsReadyToMove = this.column1Cards.some(
                    card => this.calculateProgress(card) > 50
                );

                if (hasCardsReadyToMove) {
                    this.column1Blocked = true;
                } else {
                    this.column1Blocked = false;
                }
            } else {
                this.column1Blocked = false;
            }

            let changes = false;

            const updatedCards = this.cards.map(card => {
                const progress = this.calculateProgress(card);

                if (card.column === 1 && progress > 50 && !this.column1Blocked) {
                    const currentColumn2Count = this.cards.filter(c => c.column === 2).length;
                    if (currentColumn2Count < 5) {
                        changes = true;
                        console.log('Карточка перемещена из 1 во 2 колонку');
                        return { ...card, column: 2 };
                    }
                }

                if (card.column === 2 && progress === 100) {
                    changes = true;
                    console.log('Карточка перемещена из 2 в 3 колонку');
                    return {
                        ...card,
                        column: 3,
                        completedAt: this.formatDateTime(new Date())
                    };
                }

                return card;
            });

            if (changes) {
                this.cards = updatedCards;
            }
        },

        calculateProgress(card) {
            if (!card.items.length) return 0;
            const completed = card.items.filter(i => i.completed).length;
            return Math.round((completed / card.items.length) * 100);
        },

        saveToLocalStorage() {
            localStorage.setItem('cards', JSON.stringify(this.cards));
        },

        loadFromLocalStorage() {
            const saved = localStorage.getItem('cards');
            if (saved) {
                this.cards = JSON.parse(saved);
                this.$nextTick(() => {
                    this.checkMoveConditions();
                });
            }
        }
    },
    mounted() {
        this.loadFromLocalStorage();
    }
});