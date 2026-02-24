Vue.component('card-item', {
    props: ['card', 'column1Blocked'],
    template: `
        <div class="card" :class="{ 'blocked-card': blocked, 'editing': isEditing }">
            <div class="card-header">
                <div v-if="!isEditing" class="card-title-container">
                    <h3>{{ card.title }}</h3>
                </div>
                <div v-else class="edit-title-container">
                    <input 
                        type="text" 
                        v-model="editTitle" 
                        placeholder="Заголовок"
                        class="edit-title-input"
                    >
                </div>
                <div class="card-actions">
                    <button 
                        v-if="card.column === 1 && !isEditing" 
                        @click="startEditing" 
                        class="edit-card-btn" 
                        title="Редактировать карточку"
                        :disabled="blocked"
                    >✎</button>
                    <button @click="deleteCard" class="delete-card-btn" title="Удалить карточку">×</button>
                </div>
            </div>
            
            <div v-if="!isEditing" class="card-author">
                {{ card.author }}
            </div>
            <div v-else class="edit-author-container">
                <input 
                    type="text" 
                    v-model="editAuthor" 
                    placeholder="Автор"
                    class="edit-author-input"
                >
            </div>
            
            <div v-if="blocked && !isEditing" class="blocked-indicator">
                Колонка заблокирована (Вторая колонка заполнена)
            </div>
            
            <div class="progress-bar" v-if="card.items.length && !isEditing">
                <div class="progress-fill" :style="{ width: progress + '%' }"></div>
                <span class="progress-text">{{ progress }}%</span>
            </div>
            
            <div class="card-items">
                <template v-if="!isEditing">
                    <div v-for="item in card.items" :key="item.id" class="card-item">
                        <input 
                            type="checkbox" 
                            :checked="item.completed"
                            @change="toggleItem(item.id)"
                            :disabled="blocked"
                        >
                        <span :class="{ completed: item.completed }">{{ item.text }}</span>
                    </div>
                </template>
                <template v-else>
                    <div v-for="(item, index) in editItems" :key="item.id" class="card-item edit-mode">
                        <input 
                            type="checkbox" 
                            v-model="item.completed"
                            :disabled="true"
                        >
                        <input 
                            type="text" 
                            v-model="item.text" 
                            class="edit-item-input"
                            placeholder="Текст пункта"
                        >
                        <button @click="removeEditItem(index)" class="remove-edit-item" title="Удалить пункт">×</button>
                    </div>
                    
                    <div v-if="editItems.length < 5" class="add-item-row edit-mode">
                        <input 
                            type="text" 
                            v-model="newEditItem" 
                            placeholder="Новый пункт"
                            @keyup.enter="addEditItem"
                        >
                        <button @click="addEditItem" :disabled="!newEditItem.trim()">Добавить</button>
                    </div>
                    
                    <div class="items-hint edit-mode" v-if="editItems.length < 3 || editItems.length > 5">
                        <span v-if="editItems.length < 3" class="warning">
                            Минимум 3 пункта (еще {{ 3 - editItems.length }})
                        </span>
                        <span v-if="editItems.length > 5" class="warning">
                            Максимум 5 пунктов (превышение на {{ editItems.length - 5 }})
                        </span>
                    </div>
                </template>
            </div>
            
            <div v-if="card.column === 3 && card.completedAt && !isEditing" class="completed-date">
                Завершено: {{ card.completedAt }}
            </div>
           
            <div class="add-item-form" v-if="!isEditing && card.items.length < 5 && card.column !== 3">
                <input 
                    type="text" 
                    v-model="newItemText" 
                    placeholder="Новый пункт"
                    @keyup.enter="addItem"
                    :disabled="blocked"
                >
                <button @click="addItem" :disabled="blocked">+</button>
            </div>
            
            <div v-if="!isEditing" class="card-footer">
                <small>Создано: {{ card.createdAt }}</small>
            </div>
            
            <div v-if="!isEditing && card.items.length >= 5" class="item-limit">
                Максимум пунктов (5)
            </div>
            
            <div v-if="isEditing" class="edit-actions">
                <button @click="saveEditing" class="save-edit-btn" :disabled="!isValidEdit">
                    Сохранить изменения
                </button>
                <button @click="cancelEditing" class="cancel-edit-btn">
                    Отмена
                </button>
            </div>
        </div>
    `,
    data() {
        return {
            newItemText: '',
            isEditing: false,
            editTitle: '',
            editAuthor: '',
            editItems: [],
            newEditItem: ''
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
        },
        isValidEdit() {
            if (!this.editTitle.trim() || !this.editAuthor.trim()) return false;
            if (this.editItems.length < 3 || this.editItems.length > 5) return false;
            return this.editItems.every(item => item.text.trim());
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
        },
        startEditing() {
            if (this.card.column !== 1 || this.blocked) return;

            this.editTitle = this.card.title;
            this.editAuthor = this.card.author;
            this.editItems = this.card.items.map(item => ({
                ...item,
                id: item.id
            }));
            this.isEditing = true;
        },
        cancelEditing() {
            this.isEditing = false;
            this.editTitle = '';
            this.editAuthor = '';
            this.editItems = [];
            this.newEditItem = '';
        },
        addEditItem() {
            if (!this.newEditItem.trim()) return;
            if (this.editItems.length >= 5) {
                alert('Максимум 5 пунктов!');
                return;
            }

            this.editItems.push({
                id: Date.now() + Math.random(),
                text: this.newEditItem,
                completed: false
            });

            this.newEditItem = '';
        },
        removeEditItem(index) {
            this.editItems.splice(index, 1);
        },
        saveEditing() {
            if (!this.isValidEdit) {
                alert('Проверьте данные: заголовок, автор и от 3 до 5 заполненных пунктов');
                return;
            }

            const updatedCard = {
                ...this.card,
                title: this.editTitle,
                author: this.editAuthor,
                items: this.editItems.map(item => ({
                    ...item,
                    completed: item.completed || false
                }))
            };

            this.$emit('update-card', updatedCard);
            this.isEditing = false;
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

            const now = new Date();
            this.cards.push({
                id: Date.now(),
                title: this.newCardTitle,
                author: this.newCardAuthor,
                column: 1,
                items: [...this.tempItems],
                createdAt: this.formatDate(now)
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