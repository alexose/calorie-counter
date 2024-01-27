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
                this.items = obj.data;
            },
            toggleItem(item) {
                // If item is selected, remove it from the array.  Otherwise, add it to the array
                this.selected = this.selected.includes(item)
                    ? this.selected.filter(i => i !== item)
                    : this.selected.slice().concat([item]);
                this.$emit("selected", item);
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
                        acc.calories += item.calories;
                        acc.carbs += item.carbs;
                        acc.fat += item.fat;
                        acc.protein += item.protein;
                        return acc;
                    },
                    {
                        calories: 0,
                        carbs: 0,
                        fat: 0,
                        protein: 0,
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
                    <td>{{ totals?.calories }}</td>
                    <td>{{ totals?.carbs }}</td>
                    <td>{{ totals?.fat }}</td>
                    <td>{{ totals?.protein }}</td>
                </tr>
            </tbody>
        </table>
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
                    :class="{selected: selected.includes(item)}"
                >
                    <td>{{ item.name }}</td>
                    <td>{{ humanizeDate(item.consumed_at) }}</td>
                    <td>{{ item.calories }}</td>
                    <td>{{ item.carbs }}</td>
                    <td>{{ item.fat }}</td>
                    <td>{{ item.protein }}</td>
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
