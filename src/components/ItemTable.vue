<script>
    export default {
        data() {
            return {
                items: [],
                selected: [],
                isDragging: false,
                lastClickedItem: null,
            };
        },
        methods: {
            async getItems() {
                const response = await fetch("/items/last7days");
                const obj = await response.json();

                const items = obj.data.map(item => {
                    const date = new Date(item.consumed_at);
                    const isEvenDate = date.getDate() % 2 === 0;
                    return {
                        ...item,
                        isEvenDate,
                    };
                });

                this.items = items;
                this.selectToday();
            },
            toggleItem(item) {
                // If item is selected, remove it from the array.  Otherwise, add it to the array
                this.selected = this.selected.includes(item)
                    ? this.selected.filter(i => i !== item)
                    : this.selected.slice().concat([item]);
                this.$emit("selected", item);
            },
            estimates(item, field) {
                const low = item[field + "_low"];
                const high = item[field + "_high"];
                return low !== undefined && high !== undefined ? `Between ${low} and ${high} ${field}` : "";
            },
            selectToday() {
                const today = new Date().toLocaleDateString();
                this.selected = this.items.filter(item => {
                    const itemDate = new Date(item.consumed_at).toLocaleDateString();
                    return itemDate === today;
                });
            },
            selectYesterday() {
                const today = new Date();
                const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

                this.selected = this.items.filter(item => {
                    const itemDateUtc = new Date(item.consumed_at);
                    const itemDateLocal = new Date(itemDateUtc.getTime() + itemDateUtc.getTimezoneOffset() * 60 * 1000);
                    return itemDateLocal >= yesterday && itemDateLocal < today;
                });
            },
            selectThisWeek() {
                const today = new Date();
                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                this.selected = this.items.filter(item => {
                    const itemDate = new Date(item.consumed_at);
                    return itemDate >= weekAgo && itemDate <= today;
                });
            },
            humanizeDate(date) {
                return new Date(date).toLocaleString();
            },
            startDrag(item) {
                this.isDragging = true;
                this.lastClickedItem = item;
                this.toggleItem(item);
            },
            endDrag() {
                this.isDragging = false;
                this.lastClickedItem = null;
            },
            handleDrag(item) {
                if (this.isDragging && this.lastClickedItem !== item) {
                    this.toggleItem(item);
                }
            },
        },
        computed: {
            totals() {
                return this.selected.reduce(
                    (acc, item) => {
                        acc.calories_low += item.calories_low || item.calories;
                        acc.carbs_low += item.carbs_low || item.carbs;
                        acc.fat_low += item.fat_low || item.fat;
                        acc.protein_low += item.protein_low || item.protein;
                        acc.calories += item.calories;
                        acc.carbs += item.carbs;
                        acc.fat += item.fat;
                        acc.protein += item.protein;
                        acc.calories_high += item.calories_high || item.calories;
                        acc.carbs_high += item.carbs_high || item.carbs;
                        acc.fat_high += item.fat_high || item.fat;
                        acc.protein_high += item.protein_high || item.protein;
                        return acc;
                    },
                    {
                        calories_low: 0,
                        carbs_low: 0,
                        fat_low: 0,
                        protein_low: 0,
                        calories: 0,
                        carbs: 0,
                        fat: 0,
                        protein: 0,
                        calories_high: 0,
                        carbs_high: 0,
                        fat_high: 0,
                        protein_high: 0,
                    }
                );
            },
        },
        mounted() {
            this.getItems();
        },
    };
</script>

<template>
    <div>
        <table class="table table-striped">
            <caption>
                Selected Items
            </caption>
            <thead>
                <tr>
                    <th scope="col">Calories</th>
                    <th scope="col">Carbs</th>
                    <th scope="col">Fat</th>
                    <th scope="col">Protein</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td :title="estimates(totals, 'calories')">{{ totals?.calories }}</td>
                    <td>{{ totals?.carbs }}</td>
                    <td>{{ totals?.fat }}</td>
                    <td>{{ totals?.protein }}</td>
                </tr>
            </tbody>
        </table>
        <div class="select-buttons">
            <button type="button" class="btn btn-primary" @click="selected = items.slice()">Select All</button>
            <button type="button" class="btn btn-primary" @click="selectToday">Select Today</button>
            <button type="button" class="btn btn-primary" @click="selectYesterday">Select Yesterday</button>
            <button type="button" class="btn btn-primary" @click="selectThisWeek">Select This Week</button>
            <div class="divider"></div>
            <button type="button" class="btn btn-primary" @click="selected = []">Clear Selection</button>
        </div>
        <table class="table table-striped" :class="{dragging: isDragging}">
            <thead>
                <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Consumed At</th>
                    <th scope="col">Calories</th>
                    <th scope="col">Carbs</th>
                    <th scope="col">Fat</th>
                    <th scope="col">Protein</th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="item in items"
                    :key="item.id"
                    @mousedown="startDrag(item)"
                    @mouseup="endDrag()"
                    @mouseenter="handleDrag(item)"
                    :class="{selected: selected.includes(item), isEvenDate: !!item.isEvenDate}"
                >
                    <td>{{ item.name }}</td>
                    <td>{{ humanizeDate(item.consumed_at) }}</td>
                    <td :title="estimates(item, 'calories')">{{ item.calories }}</td>
                    <td :title="estimates(item, 'carbs')">{{ item.carbs }}</td>
                    <td :title="estimates(item, 'fat')">{{ item.fat }}</td>
                    <td :title="estimates(item, 'protein')">{{ item.protein }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
    h1 {
        font-weight: 500;
        font-size: 2.6rem;
        position: relative;
        top: -10px;
    }

    h3 {
        font-size: 1.2rem;
    }

    div.select-buttons {
        margin-bottom: 20px;
        display: flex;
        align-items: center;
    }

    div.select-buttons button {
        margin-right: 10px;
        border: none;
        padding: 10px;
        cursor: pointer;
    }

    div.select-buttons .divider {
        display: inline-block;
        width: 1px;
        height: 30px;
        background-color: #ccc;
        margin: 0 20px 0 10px;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
    }

    th,
    td {
        padding: 8px;
        text-align: left;
        border-bottom: 1px solid #ddd;
    }

    th {
        background-color: #f2f2f2;
        color: #333;
    }

    tr:hover {
        background-color: #f5f5f5;
    }

    tr.selected {
        background-color: #f5f5f5;
    }

    tr.isEvenDate {
        border-left: 5px solid #e6f2ff;
    }

    table.dragging {
        user-select: none;
    }

    table caption {
        padding: 10px;
        font-size: 24px;
        font-weight: bold;
        text-align: left;
    }

    @media (min-width: 1024px) {
        .greetings h1,
        .greetings h3 {
            text-align: left;
        }
    }
</style>
