const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./assets/swagger.json");
// Import middleware
const morgan = require("morgan")("dev");
const bodyparser = require("body-parser");

const mysql = require("promise-mysql");

const config = require("./assets/config");
// Import custom module
const { checkAndChange } = require("./assets/functions");

// Mysql connection
mysql
    .createConnection({
        host: config.db.host,
        port: config.db.port,
        database: config.db.database,
        user: config.db.user,
        password: config.db.password,
    })
    .then((db) => {
        console.log("connected");
        const app = express();

        //  Setup router
        let membersRouter = express.Router();
        let Members = require("./assets/classes/members-class")(db, config);

        // Middleware for debug in console
        app.use(morgan);

        // Middleware for parsing and access to data in body
        app.use(bodyparser.json()); // for parsing application/json
        app.use(bodyparser.urlencoded({ extended: true })); // for parsing application/x-www-urlencoded
        app.use(
            `${config.rootAPI}api-docs`,
            swaggerUi.serve,
            swaggerUi.setup(swaggerDocument)
        );

        membersRouter
            .route("/:id")
            // Get member with his id
            .get(async (req, res) => {
                let member = await Members.getByID(req.params.id);
                res.json(checkAndChange(member));
            })
            // Update name member
            .put(async (req, res) => {
                let updateMember = await Members.update(
                    req.params.id,
                    req.body.name
                );
                res.json(checkAndChange(updateMember));
            })
            // Delete member with id
            .delete(async (req, res) => {
                let deleteMember = await Members.delete(req.params.id);
                res.json(checkAndChange(deleteMember));
            });

        membersRouter
            .route("/")
            // Get list members
            .get(async (req, res) => {
                let allMembers = await Members.getAll(req.query.max);
                res.json(checkAndChange(allMembers));
            })
            // Create member
            .post(async (req, res) => {
                let addMember = await Members.add(req.body.name);
                res.json(checkAndChange(addMember));
            });

        //  Default url router
        app.use(`${config.rootAPI}members`, membersRouter);

        app.listen(config.port, () => console.log("Started"));
    })
    .catch((err) => {
        console.log("Error during database connection");
        console.log(err.message);
    });
