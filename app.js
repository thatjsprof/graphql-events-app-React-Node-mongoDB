const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const Event = require("./models/events");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  "/graphql",
  graphqlHTTP({
    schema: buildSchema(
      `
            type Event {
                _id: ID!
                title: String!
                description: String!
                price: Float!
                date: String!
            }
            input EventInput {
                title: String! 
                description: String! 
                price: Float! 
                date: String!
            }
            type RootQuery {
                events: [Event!]!
            }
            type RootMutation {
                addEvent(eventInput: EventInput): Event
            }
            schema {
                query: RootQuery
                mutation: RootMutation
            }
        `
    ),
    rootValue: {
      events: () => {
        return Event.find()
          .then((events) =>
            events.map((event) => ({
              ...event._doc,
              _id: event._doc._id.toString(),
            }))
          )
          .catch((err) => console.log(err));
      },
      addEvent: ({ eventInput }) => {
        const { title, description, price, date } = eventInput;
        const event = new Event({
          title,
          description,
          price: +price,
          date: new Date(date),
        });

        event
          .save()
          .then((result) => {
            console.log(result);
            return { ...result._doc, _id: result._doc._id.toString() };
          })
          .catch((err) => {
            console.log(err);
            throw err;
          });
        return event;
      },
    },
    graphiql: true,
  })
);

const port = 3000;

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.aq6mn.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(port, (err) => {
      if (err) {
        console.log(err);
      }
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
