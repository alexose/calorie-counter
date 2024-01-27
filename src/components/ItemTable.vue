<script>
    export default {
        data() {
            return {
                items: [],
            };
        },
        methods: {
            async getItems() {
                const response = await fetch("/items");
                const obj = await response.json();
                this.items = obj.data;
                console.log(this.items);
            },
        },
        mounted() {
            this.getItems();
        },
    };
</script>

<template>
    <div class="greetings">
        <table class="table table-striped">
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
                <tr v-for="item in items" :key="item.id">
                    <td>{{ item.name }}</td>
                    <td>{{ item.consumed_at }}</td>
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

    .greetings h1,
    .greetings h3 {
        text-align: center;
    }

    @media (min-width: 1024px) {
        .greetings h1,
        .greetings h3 {
            text-align: left;
        }
    }
</style>
