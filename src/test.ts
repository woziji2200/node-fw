import path = require("path");
import fw from "./index"
export let app = new fw();

app.registerRouter(path.join(__dirname));
app.listen(3000, () => {
    console.log('Server started on port 3000');
})