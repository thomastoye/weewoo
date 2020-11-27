# Parse CloudEngine POST bodies

When using [EnCo/Proximus CloudEngine](https://cloudengine.enco.io/), you can `POST` the received data to a webhook where you can do further processing.

Use the following script on CloudEngine:

```
object json = create("Json");
object array = create("Array");

function run(object data, object tags, string asset) {
    if( (array.containsAll(tags, ["DATA"])) && asset == "lora4makers" ) {
        object jsonObject = json.createNewObjectNode();
        
        foreach (key in data) {
            if (data[key] != null && key != "PAYLOAD" ) {
                jsonObject.set(key.getString(), data[key].getString());
            }
        }
        
        jsonObject.set("Asset", asset);
        jsonObject.set("Payload", data["PAYLOAD"].getBase64String());
        
        string fullTags = "";
        foreach(key in tags) {
            fullTags = fullTags + tags[key] + ", ";
        }
        jsonObject.set("FullTags", fullTags);
        
        object http = create("HTTP", "http://requestbin.net/r/vdqdhtvd", "POST");
        http.setContentType("application/json");
        http.setData(jsonObject);
        http.send();
    }
}
```
