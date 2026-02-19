// Компонент карточки
Vue.component('card-item', {
    props: ['card', 'column1Blocked'],
    template: `
        <div class="card" :class="{ 'blocked-card': blocked }">
            <h3>{{ card.title }}</h3>
            
            <!-- Индикатор блокировки -->
            <div v-if="blocked" class="blocked-indicator">
                🔒 Колонка заблокирована
            </div>
            
            <!-- Прогресс-бар -->
            <div class="progress-bar" v-if="card.items.length">
                <div class="progress-fill" :style="{ width: progress + '%' }"></div>
                <span class="progress-text">{{ progress }}%</span>
            </div>
            
            <!-- Пункты списка -->
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
            
            <!-- Дата завершения (для 3 колонки) -->
            <div v-if="card.column === 3 && card.completedAt" class="completed-date">
                ✅ Завершено: {{ card.completedAt }}
            </div>
            
            <!-- Форма добавления пункта -->
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
            
            <!-- Информация о лимите -->
            <div v-if="card.items.length >= 5" class="item-limit">
                ⚠️ Максимум пунктов (5)
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
        }
    }
});

new Vue({
    el: '#app',
    data: {
        newCardTitle: '',
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
        createCard() {
            if (!this.newCardTitle.trim() || !this.canCreateCard) return;

            const items = [];
            for (let i = 1; i <= 3; i++) {
                items.push({
                    id: Date.now() + i,
                    text: `Пункт ${i}`,
                    completed: false
                });
            }

            this.cards.push({
                id: Date.now(),
                title: this.newCardTitle,
                column: 1,
                items: items,
                createdAt: new Date().toLocaleString()
            });

            this.newCardTitle = '';
        },

        updateCard(updatedCard) {
            const index = this.cards.findIndex(c => c.id === updatedCard.id);
            if (index !== -1) {
                this.$set(this.cards, index, updatedCard);
            }
        },

        checkMoveConditions() {
            let changes = false;

            const updatedCards = this.cards.map(card => {
                const progress = this.calculateProgress(card);

                // Из 1 во 2 (при >50%)
                if (card.column === 1 && progress > 50 && !this.column1Blocked) {
                    changes = true;
                    return { ...card, column: 2 };
                }

                // Из 2 в 3 (при 100%)
                if (card.column === 2 && progress === 100) {
                    changes = true;
                    return {
                        ...card,
                        column: 3,
                        completedAt: new Date().toLocaleString()
                    };
                }

                return card;
            });

            if (changes) {
                this.cards = updatedCards;
            }

            // Проверка блокировки
            if (this.isColumn2Full) {
                const hasCardsReadyToMove = this.column1Cards.some(
                    card => this.calculateProgress(card) > 50
                );
                this.column1Blocked = hasCardsReadyToMove;
            } else {
                this.column1Blocked = false;
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