Vue.component('card-item', {
    props: ['card', 'column1Blocked'],
    template: `
        <div class="card" :class="{ 'blocked-card': blocked }">
            <h3>{{ card.title }}</h3>
            
            <div class="card-author">
                ✍️ {{ card.author }}
            </div>
            
            <div v-if="blocked" class="blocked-indicator">
                🔒 Колонка заблокирована
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
                ✅ Завершено: {{ card.completedAt }}
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
        }
    }
});

new Vue({
    el: '#app',
    data: {
        newCardTitle: '',
        newCardAuthor: '',
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
                minute: '2-digit',
                second: '2-digit'
            });
        },

        formatDate(date) {
            return date.toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        },

        createCard() {
            if (!this.newCardTitle.trim() || !this.newCardAuthor.trim()) {
                alert('Заполните заголовок и укажите ваше имя!');
                return;
            }
            if (!this.canCreateCard) return;

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
                author: this.newCardAuthor,
                column: 1,
                items: items, // ← добавляем пункты
                createdAt: this.formatDate(new Date())
            });

            this.newCardTitle = '';
            this.newCardAuthor = '';
        },

        updateCard(updatedCard) {
            const index = this.cards.findIndex(c => c.id === updatedCard.id);
            if (index !== -1) {
                this.$set(this.cards, index, updatedCard);
            }
        },

        checkMoveConditions() {
            let changes = false;

            // Сначала проверяем карточки для перемещения
            const updatedCards = this.cards.map(card => {
                const progress = this.calculateProgress(card);

                if (card.column === 1 && progress > 50 && !this.column1Blocked) {
                    changes = true;
                    return { ...card, column: 2 };
                }

                if (card.column === 2 && progress === 100) {
                    changes = true;
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

            if (this.isColumn2Full) {
                const hasCardsReadyToMove = this.column1Cards.some(
                    card => this.calculateProgress(card) > 50
                );

                if (hasCardsReadyToMove && !this.column1Blocked) {
                    this.column1Blocked = true;
                    console.log('🔒 Первая колонка заблокирована: вторая колонка заполнена');
                }
            } else {
                if (this.column1Blocked) {
                    this.column1Blocked = false;
                    console.log('🔓 Первая колонка разблокирована');
                }
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