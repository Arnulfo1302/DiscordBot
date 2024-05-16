const { Client, Events, Message } = require("discord.js");
const config = require('./conections');
const mongoose = require('mongoose');
mongoose.connect(config.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const db = mongoose.connection;
module.exports = {
    mongoURI: require('./conections').mongoURI,
    discordToken: require('./conections').discordToken
};

db.on('error', console.error.bind(console, 'Error de conexión a MongoDB:'));
db.once('open', () => {
    console.log('Conectado a MongoDB');
});
const client = new Client({
    intents: 3276799
});
client.login(config.discordToken);
client.on(Events.ClientReady, async () => {
    console.log(`Conectado como ${client.user.username}!`);
});
const saludos = ["hola", "ola", "alo", "hola!", "hola.", "buenos días", "buenos dias", "buenas tardes", "buenas noches", "buen dia", "buen día"];
const toDO = "To Do"
const doing = "Doing";
const done = "Done";
const EventoSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    creacion: { type: Date, default: Date.now },
    nombreEvento: { type: String, required: true },
    estado: { type: String, required: true },
    encargado: { type: String, required: true },
});
const Evento = mongoose.model('Evento', EventoSchema);
client.on(Events.MessageCreate, async (message) => {
    const args = message.content.trim().split(/ +/);
    const command = args.shift().toLowerCase();
    if (saludos.some(saludo => message.content.toLowerCase().includes(saludo))) {
        message.reply("Cállese");
    }
    if (command === '!evento') {
        if (args.length === 1){
            const encargado = message.author.username;
            const nombre = args.join(" ");
            message.reply(`${args}`);
            const nuevoEvento = new Evento({nombreEvento: nombre, estado: toDO, encargado: encargado});
            await nuevoEvento.save();
            const fecha = nuevoEvento.creacion;
            const formattedDate = `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
            message.reply(`Evento "${nombre}" creado el ${formattedDate} estado: ${nuevoEvento.estado} encargado: ${nuevoEvento.encargado}.`);  
        }else {
            message.reply(`Se deben escribir el comando !evento "Nombre_evento"`);
        }
    }
    if (command === '!iniciar') {
        if (args.length === 1){
            const evento = await Evento.findOne({ encargado: message.author.username, nombreEvento: args.join(" ") });
            if (message.author.username == evento.encargado & args.join(" ") == evento.nombreEvento & evento.estado == toDO) {
                message.reply(`${evento.nombreEvento} Iniciado por: ${message.author.username}.`);
                evento.estado = doing;
                try {
                    const eventoActualizado = await evento.save();
                    gift(message, "iniciar");
                } catch (error) {
                    console.error("Error al actualizar el evento:", error);
                    message.reply("Hubo un error al intentar actualizar el estado del evento. Por favor, inténtalo de nuevo más tarde.");
                }
            } else {
                message.reply('No tienes ningún evento programado.');
            }
        }else {
            message.reply('El formato correcto es !iniciar "nombre_del_evento"');
        }
    }
    if (command === '!finalizar') {
        if (args.length === 1){
            const evento = await Evento.findOne({ encargado: message.author.username, nombreEvento: args.join(" ") });
            if (message.author.username == evento.encargado & args.join(" ") == evento.nombreEvento & evento.estado == doing) {
                message.reply(`${evento.nombreEvento} Finalizado por: ${message.author.username}.`);
                evento.estado = done;
                try {
                    const eventoActualizado = await evento.save();
                    gift(message, "finalizar");
                } catch (error) {
                    console.error("Error al actualizar el evento:", error);
                    message.reply("Hubo un error al intentar actualizar el estado del evento. Por favor, inténtalo de nuevo más tarde.");
                }
            } else {
                message.reply('No tienes ningún evento Para finalizar.');
            }
        }else {
            message.reply('El formato correcto es !finalizar "nombre_del_evento"');
        }
    }
    if (command === '!kanban') {
        const eventos = await Evento.find({});
        let kanban = 'Tabla KanBan:\n\n';
        kanban += '|         To Do         |         Doing         |           Done        |        Encargado      |\n';
        kanban += '|-----------------------|-----------------------|-----------------------|-----------------------|\n';
        const maxLength = eventos.length;
        for (let i = 0; i < maxLength; i++) { 
            if(eventos[i].estado == toDO){
                kanban += '|';
                kanban += addSpacing(eventos[i].nombreEvento || "");
                kanban += '|';
                kanban += addSpacing("");
                kanban += '|';
                kanban += addSpacing("");
                kanban += '|';
                kanban += addSpacing(eventos[i].encargado || "");
                kanban += '|';
                kanban += '\n';
            }
        }
        for (let i = 0; i < maxLength; i++) { 
            if(eventos[i].estado == doing){
                kanban += '|';
                kanban += addSpacing("");
                kanban += '|';
                kanban += addSpacing(eventos[i].nombreEvento || "");
                kanban += '|';
                kanban += addSpacing("");
                kanban += '|';
                kanban += addSpacing(eventos[i].encargado || "");
                kanban += '|';
                kanban += '\n';
            }
        }
        for (let i = 0; i < maxLength; i++) { 
            if(eventos[i].estado == done){
                kanban += '|';
                kanban += addSpacing("");
                kanban += '|';
                kanban += addSpacing("");
                kanban += '|';
                kanban += addSpacing(eventos[i].nombreEvento || "");
                kanban += '|';
                kanban += addSpacing(eventos[i].encargado || "");
                kanban += '|';
                kanban += '\n';
            }
        }
        message.channel.send(`\`\`\`markdown\n${kanban}\n\`\`\``);
    }
});

function addSpacing(word){
    const space = ' ';
    let spaced = "";
    const charactersToAdd = 23 - word.length;
    const spacesOnEachSide = Math.floor(charactersToAdd / 2);
    if(word == ""){
        spaced += "                       ";
        return spaced;
    }else {
        for (let i = 0; i < spacesOnEachSide; i++){
            spaced += space;
        }
        spaced += word;
        for (let i = 0; i < charactersToAdd - spacesOnEachSide; i++){
            spaced += space;
        }
        return spaced;
    }
}

function gift(message, gif){
    let selected = "";
    const finalizar = [
        'https://tenor.com/view/party-popper-confetti-celebrate-party-cheer-gif-13610316',
        'https://tenor.com/view/おめでとう-お祝い-クラッカー-congratulations-celebrate-gif-15782637',
        'https://tenor.com/view/puglie-puglie-pug-pug-party-party-time-gif-14958615',
        'https://tenor.com/view/leonardo-dicaprio-cheers-şerefe-celebration-celebrating-gif-20368613',
    ];
    const iniciar = [
        'https://tenor.com/view/danser-encourager-on-y-va-motivation-porras-gif-15128587',
        'https://tenor.com/view/lets-go-motivation-penguin-do-it-pudgy-gif-9039988274054861410',
        'https://tenor.com/view/rascal-the-raccoon-encouragement-motivation-you-can-do-it-dont-give-up-gif-15415643',
        'https://tenor.com/view/loof-and-timmy-loof-bread-cute-bread-believe-gif-14399678',
    ];
    if(gif == "finalizar"){
        selected = finalizar;
    }else if(gif == "iniciar"){
        selected = iniciar;
    }
    try {
        const randomGifUrl = selected[Math.floor(Math.random() * selected.length)];
        message.reply(randomGifUrl);
    } catch (error) {
        console.error("Error al enviar un gif aleatorio:", error);
        message.reply("Hubo un error al intentar enviar un gif aleatorio. Por favor, inténtalo de nuevo más tarde.");
    }
}