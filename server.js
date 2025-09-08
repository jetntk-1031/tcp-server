import net from "net";
import { parseStringPromise,Builder } from "xml2js";
// import xmlFormatter from "xml-formatter";

const PORT = 50010;
const HOST = "0.0.0.0";

const builder = new Builder({
  headless: false,   // don’t add <?xml version="1.0"?>
  renderOpts: { pretty: true } // format nicely
});

///// retaining the structure object
let DDR_ES56_BodyRes = `
                <body>
                    <structArrays>
                        <array name="orderList">
                            <structDef>
                                <item name="orderNo" dataType="8" />
                                <item name="quantity" dataType="3" />
                                <item name="typeNo" dataType="8" />
                                <item name="typeVar" dataType="8" />
                                <item name="priority" dataType="3" />
                                <item name="workingCode" dataType="2" />
                                <item name="orderState" dataType="3" />
                                <item name="counter" dataType="3" />
                                <item name="batch" dataType="8" />
                            </structDef>
                            <values>
                            </values>
                        </array>
                    </structArrays>
                    <structs />
                </body>
    `;
                          
let DDR_ES56_Obj = await parseStringPromise(DDR_ES56_BodyRes);

let chgOver_Subject = 0;

const MagProdRcp = {
    0:["100","csp-240403-01_S2"],
    1:["175","csp-240403-01_S2"]
}
//0: {MagTypeNo: ,MagId, PanelCount,}
let MagRecord = {

}
//    2:["200","Mag1"],
function extractXml(data) {
  let xml;

  // If it's a Buffer (from TCP socket)
  if (Buffer.isBuffer(data)) {
    // If first byte looks like '<' -> no length prefix
    if (data[0] === 0x3C) { // '<'
      xml = data.toString("utf8");
    } else {
      // Assume 4-byte length prefix
      let len = data.readUInt32BE(0);
      xml = data.slice(4, 4 + len).toString("utf8");
    }
  } 
  // If it's a string
  else if (typeof data === "string") {
    data = data.trimStart();
    if (data.startsWith("<")) {
      xml = data; // already pure XML
    } else {
      // Assume first 4 chars are hex length
      xml = data.slice(4).trimStart();
    }
  }

  return xml;
}


const server = net.createServer((socket) => {
  console.log(`Client connected: ${socket.remoteAddress}:${socket.remotePort}`);

  socket.on("data", async (data) => {
    console.log(`RCV_FROM_MACHINE : ${data} \n`);
    const xmlInput = extractXml(data).toString().trim();
    try {
        const request = await parseStringPromise(xmlInput);
        await CheckEvent(request);
        
        let formatted_xml = builder.buildObject(request)
        console.log(`SND_TO_MACHINE : ${formatted_xml} \n`);
        socket.write(formatted_xml);
 
    } catch (error) {
        let err_txt = `Error : ${error}`
        console.log(`ERROR_TO_MACHINE : ${err_txt} \n`);
        // console.log(err_txt)
        socket.write(err_txt);
    };

    });
  });


server.listen(PORT, HOST, () => {
  console.log(`🚀 TCP XML Server running at ${HOST}:${PORT}`);
});

let CheckEvent = async (request) => {
    if(!request.hasOwnProperty('root')){
        throw new Error("missing root ")
    }
    if(!request.root.hasOwnProperty('header')){
        throw new Error("missing header ")
    }

    if(!request.root.hasOwnProperty('event')){
        throw new Error("missing event ")
    }

    let header = request.root.header;
    if(!request.root.header[0].$.hasOwnProperty('eventName')){
        throw new Error("missing eventName")
    }
    let eventNm = request.root.header[0].$.eventName;
    if(!request.root.event[0].hasOwnProperty(eventNm)){
        throw new Error("missing event Attribute ")
    }

    //Error handling completed
    if(!request.root.header[0].$.hasOwnProperty('eventSwitch')){
        throw new Error("missing EvenSwitch")
    }
    let eventswitch = request.root.header[0].$.eventSwitch;

    if(eventNm == "plcChangeOverStarted"){
        await plcChangeOverStarted(request.root);
    }else if (eventNm == "partReceived"){
        if (eventswitch == "-1")
        {
            await partReceived_ES1(request.root);
        }
        else if (eventswitch == "10")
        {
            await partReceived_ES10(request.root);
        }
    }
     else if (eventNm == "dataDownloadRequired" ){
        
        if (eventswitch == "1")
        {
            await dataDownloadRequiredES_1(request.root);
        }
        else if (eventswitch == "15")
        {
            await dataDownloadRequiredES_15(request.root);
        }
        else if (eventswitch == "56")
        {
            await dataDownloadRequiredES_56(request.root);
        }
        
    }
    else if (eventNm == "dataUploadRequired") {
        // if (eventswitch == "10"){
        //     await dataUploadRequired_ES_10(request.root);
        // }
        if (eventswitch == "52"){
            await dataUploadRequired_ES_52(request.root);
        }
    }
    else if (eventNm == "partProcessed") {
        if (eventswitch == "-1")
        {
            await partProcessed_ES1(request.root);
        }
        else if (eventswitch == "10")
        {
            await partProcessed_ES10(request.root);
        }
        else if (eventswitch == "11")
        {
            await partProcessed_ES11(request.root);
        }
    }
    
    
};

let partReceived_ES1 = async (root) => {
    if (! checkPR_ES1(root.event[0].partReceived[0].$)){
        format_returncode(root,0,"Part Receive Failed")
        return;
    };
    
    //correct instance
    
    let Res = await PR_ES1_Body(root.event[0]);

    format_returncode(root,0,null)
    format_body(root.body,Res);
    
}
let checkPR_ES1 = (eventAttribute) => {return true;};
let PR_ES1_Body = async (event) => {
    let PR_ES1_BodyRes = `
                    <body>
                        <items>
                            <item name="LocationState" value="0" dataType="3" />
                            <item name="ProcessState" value="0" dataType="3" />
                            <item name="ToolState" value="0" dataType="3" />
                        </items>
                        <structs>
                            <workPart changeOver="false" partForStation="false" typeNo="1111111111" typeVar="0001" workingCode="0" identifier="MLL_Panel01" batch="12345" passThrough="false" nextProcessNo="25" partState="5" />
                        </structs>
                    </body>
                    `;
   //To Link
    let ES56Obj_item = DDR_ES56_Obj.body.structArrays[0].array[0].values[0];
    //pointer
    let PR_ES1_Obj = await parseStringPromise(PR_ES1_BodyRes);
    
    PR_ES1_Obj.body.structs[0] = {'workPart' : []}
   
    //find relevant part
    let WO_item = ES56Obj_item.item.find(item => (item.$.typeNo == event.partReceived[0].$.typeNo || simpleHash(item.$.typeNo) == event.partReceived[0].$.typeNo ));

    PR_ES1_Obj.body.structs[0].workPart[0] = {
        "$":{
            "changeOver" : "false",
            "partForStation": "true",
            "typeNo":WO_item.$.typeNo,
            "typeVar":WO_item.$.typeVar,
            "workingCode":"0",
            "identifier": event.partReceived[0].$.identifier,
            "batch":WO_item.$.batch,
            "passThrough": "false",
            "nextProcessNo": "0",
            "partState": WO_item.$.orderState
        }
    }


  return PR_ES1_Obj;
}


let partReceived_ES10 = async (root) => {
    let magPos = checkPR_ES10(root)
    if (!magPos){
        return;
    };
  
    //correct instance
    

    try {
        let  item_refer = DDR_ES56_Obj.body.structArrays[0].array[0].values[0].item;

        //if typeNo Not found in registered Magazine assign new
        let PanelType,PanelCount,MagazineId;
        if (MagRecord[magPos]?.MagId && MagRecord[magPos].MagId == root.event[0].partReceived[0].$.identifier ){
            MagazineId = MagRecord[magPos].MagId;
            PanelType = MagRecord[magPos].MagTypeNo; 
            PanelCount = MagRecord[magPos].PanelCnt ;
        }
        else{
            MagazineId = root.event[0].partReceived[0].$.identifier,
            PanelType = item_refer[0].$.typeNo ;
            PanelCount = getRandomRange(0,(item_refer[0].$.quantity - item_refer[0].$.counter) *0.8);
        }
   
        //register Magazine
        MagRecord[magPos] = {
            "MagId" : MagazineId,
            "PanelCnt" : PanelCount,
            "MagTypeNo" : PanelType
        };


        let  Res = await PR_ES10_Body(PanelCount,PanelType);
        format_returncode(root,0,null);
        format_body(root.body,Res);
    } catch (error) {
        console.error("Failed to parse:", error.message);
    }

}
let checkPR_ES10 = (root) => {

    let MagId = root.event[0].partReceived[0]?.$?.hasOwnProperty("identifier")
    if (!MagId){
        format_returncode(root,-1,"No Mag Identifier received In Part Receive");
        return false;
    }
    let MagPosIdx = root.body[0].items[0].item.find(item => item.$.name == "magazinePosition" )
    if (!MagPosIdx){
        format_returncode(root,-1,"Mag Pos Not Given In Prat Receive");
        return false;
    }
    if ( MagPosIdx.$.value < 1 || MagPosIdx.$.value > 3 ){
        format_returncode(root,-1," Invalid Mag Pos In Part Receive ");
        return false;
    }

    return MagPosIdx.$.value;
};
let PR_ES10_Body = async (PanelCount,PanelType) => {
    let template = `
                    <body>
                        <items>
                            <item name="panelsCount" value="${PanelCount}" dataType="8" />
                            <item name="loadedPanelType" value="${PanelType}" dataType="8" />
                        </items>
                        <structs />
                    </body>
                    `;
    const xmlInput = template.toString().trim();

    try {
        const request = await parseStringPromise(xmlInput);
        return request;
    } catch (err) {
        console.error("❌ Error parsing XML:", err.message);
        // You can throw the error or return a specific value, depending on your error-handling strategy
        throw err;
    }
};
let getRandomRange = (min,max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min ;
}


//End of PR_ES1

let partProcessed_ES1 = async (root) => {
    if (! checkPP_ES1(root.event[0].partProcessed[0].$)){
        format_returncode(root,0,"Part Process Failed")
        return;
    };
    
    //correct instance
    PP_ES1_updateES56Obj(DDR_ES56_Obj.body.structArrays[0].array[0].values[0].item,root.body[0].structs[0].resHead[0].$.typeNo)
    format_returncode(root,0,null)
    format_body(root.body)
}
let checkPP_ES1 = (eventAttribute) => {return true;};

let PP_ES1_updateES56Obj=  (ES56_Obj_Items,typeNo) => {
   let index = ES56_Obj_Items.findIndex(obj => obj.$.typeNo === typeNo);
   if (index != -1) { //searched
        let num = parseInt(ES56_Obj_Items[index].$.counter, 10);
        ES56_Obj_Items[index].$.counter = String(num+1);
     }
};



let partProcessed_ES10 = async (root) => {
    let magPos = checkPP_ES10(root)
    if (! magPos ){
        return;
    };
    
    //correct instance
    if (MagRecord[magPos].MagId == root.event[0].partProcessed[0].$.identifier){
         delete MagRecord[magPos];
    }
    format_returncode(root,0,null)
    format_body(root.body)
}
let checkPP_ES10 = (root) => {
    let MagId = root.event[0].partProcessed[0]?.$?.hasOwnProperty("identifier")
    if (!MagId){
        format_returncode(root,-1,"No Mag Identifier received In Part Process");
        return false;
    }
    let MagPosIdx = root.body[0].items[0].item.find(item => item.$.name == "magazinePosition" )
    if (!MagPosIdx){
        format_returncode(root,-1,"Mag Pos Not Given In Part Process");
        return false;
    }
    if ( MagPosIdx.$.value < 1 || MagPosIdx.$.value > 3 ){
        format_returncode(root,-1,"Invalid Mag Pos In Part Process ");
        return false;
    }
    if (! MagRecord[MagPosIdx.$.value]?.hasOwnProperty("MagId") ){
        format_returncode(root,-1,"No Magazine Position Recorded in previous Part Received");
        return false;
    }
    if (MagRecord[MagPosIdx.$.value].MagId != root.event[0].partProcessed[0].$.identifier){
        format_returncode(root,-1,`Not Similar Recorded from Part Received stored in previous ${MagPosIdx.$.value} position`);
        return false;
    }
    return MagPosIdx.$.value;
};

let partProcessed_ES11 = async (root) => {
    if (! checkPP_ES11(root.event[0].partProcessed[0].$)){
        format_returncode(root,0,"Part Process Failed")
        return;
    };
    
    //correct instance
    format_returncode(root,0,null)
    format_body(root.body)
}
let checkPP_ES11 = (eventAttribute) => {return true;};




let plcChangeOverStarted = async (root) => {
    if (! checkTTNR(root.event[0].plcChangeOverStarted[0].$)){
        format_returncode(root,0,"Change Over Started Failed")
        return;
    };
    //parsed the changeover typeNo 1st 
    chgOver_Subject = stringToRangedNumber(root.event[0].plcChangeOverStarted[0].$.typeNo,0,Object.keys(MagProdRcp).length-1);

    //correct instance
    format_returncode(root,0,null)

    if(!root.hasOwnProperty("body") || root.body == null){
        root["body"] = [null];
    }

    format_body(root.body)
}
let checkTTNR = (eventAttribute) => {return true;}
function stringToRangedNumber(str, min, max) {
  // 1. Convert the string to a non-negative integer using a simple hash.
  //    This part is deterministic: the same string always produces the same hash.
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Ensure 32-bit integer
  }
  
  // Make sure the hash is a positive number.
  const positiveHash = Math.abs(hash);

  // 2. Map the hash to the specified range [min, max].
  const range = max - min + 1;
  const result = (positiveHash % range) + min;

  return result;
}



let dataDownloadRequiredES_1 = async (root) => {
    if (! checkDDR_ES1(root.event[0].dataDownloadRequired[0].$)){
        format_returncode(root,0,"Data Download Required Failed")
        return;
    };
    
    //correct instance
    format_returncode(root,0,null)
    
    let ProgNm = MagProdRcp[chgOver_Subject][0]
    let MagType = MagProdRcp[chgOver_Subject][1]
    //format body
    let Res = await DDR_ES1_Body(ProgNm,MagType);
    format_body(root.body,Res)
    
}
let checkDDR_ES1 = (eventAttribute) => {return true;}
let DDR_ES1_Body = async (ProgNm, MagType) => {
    let template = `
        <body>
            <items>
                <item name="Prog1.Name" value="${ProgNm}" dataType="8" />
                <item name="MagazineType" value="${MagType}" dataType="8" />
            </items>
        </body>
    `;
    const xmlInput = template.toString().trim();

    try {
        const request = await parseStringPromise(xmlInput);
        return request;
    } catch (err) {
        console.error("❌ Error parsing XML:", err.message);
        // You can throw the error or return a specific value, depending on your error-handling strategy
        throw err;
    }
};

let dataDownloadRequiredES_15 = async (root) => {
    if (! checkDDR_ES15(root.event[0].dataDownloadRequired[0].$)){
        format_returncode(root,0,"Data Download Required ES_15 Failed")
        return;
    };
    
    let Res = await DDR_ES15_Body();
    //correct instance
    format_returncode(root,0,null)
    //format body
    format_body(root.body,Res)   
}
let DDR_ES15_Body = async () => {
    let DDR_ES15_BodyRes = `
            <body>
                <structArrays>
                    <array name="TypeDataResponse">
                        <structDef>
                            <item name="orderNo" dataType="8" />
                            <item name="priority" dataType="3" />
                            <item name="typeNo" dataType="8" />
                            <item name="typeVar" dataType="8" />
                        </structDef>
                        <values>
                        </values>
                    </array>
                </structArrays>
                <structs />
            </body>
`;
   //To Link
    let ES56Obj_item = DDR_ES56_Obj.body.structArrays[0].array[0].values[0];
    //pointer
    let DDR_ES15_Obj = await parseStringPromise(DDR_ES15_BodyRes);
    
    DDR_ES15_Obj.body.structArrays[0].array[0].values[0] = {'item' : []}
    let item_refer = DDR_ES15_Obj.body.structArrays[0].array[0].values[0];

    ES56Obj_item.item.map(item => item_refer.item.push(
        {"$":{
            'orderNo': item.$.orderNo,
            'typeNo' : simpleHash(item.$.typeNo),
            'typeVar' : item.$.typeVar,
            'priority' : item.$.priority
        }
        }
    ))
  return DDR_ES15_Obj;
}
let checkDDR_ES15 = (eventAttribute) => {return true;}
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Ensure the hash is a 32-bit integer
  }
  return "SMT" + hash.toString().slice(0,str.length-3);
}



let dataDownloadRequiredES_56 = async (root) => {
    if (! checkDDR_ES56(root.event[0].dataDownloadRequired[0].$)){
        format_returncode(root,0,"Data Download Required ES_56 Failed")
        return;
    };
    
    //correct instance
    format_returncode(root,0,null)

    //format body
    let MaxItem = 5;
    try{
        let Res = await DDR_ES56_Body(MaxItem);
        format_body(root.body,Res);
    }catch (error){
        console.error("Failed to parse:", error.message);
    }

}

let checkDDR_ES56 = (eventAttribute) => {return true;}

let DDR_ES56_Body = async (maxItem) => {
   
    let item_refer = DDR_ES56_Obj.body.structArrays[0].array[0].values[0];
    if(!item_refer.hasOwnProperty('item')){
        DDR_ES56_Obj.body.structArrays[0].array[0].values[0] = {'item' : []}
    }
    //capture head
    item_refer = DDR_ES56_Obj.body.structArrays[0].array[0].values[0];
    if(!item_refer.item[0]){
        DDR_ES56_Obj.body.structArrays[0].array[0].values[0].item.push({"$":{
            'orderNo': "OA1001",
            'quantity': "10",
            'typeNo' : "FA11111111",
            'typeVar' : "0001",
            'priority' : "1",
            'workingCode' : "0",
            'orderState' : "2",
            'counter' : "0",
            'batch' : "1",
        }
        })
    }
    //rearrange priority
    item_refer.item.map((itm,idx) => itm.$.priority = idx+1);
    // item_refer.item.map()
    while(item_refer.item.length != 0 && item_refer.item.length <  maxItem){
        let idx = item_refer.item.length-1;
        item_refer.item.push({"$":{
            'orderNo': getNextIdx(item_refer.item[idx].$.orderNo,1,9999,20),
            'quantity':getNextIdx(item_refer.item[idx].$.quantity,10,24,2),
            'typeNo' :getNextIdx(item_refer.item[idx].$.typeNo,0,9999999999,88),
            'typeVar' :getNextIdx(item_refer.item[idx].$.typeVar,0,9999,77),
            'priority' :getNextIdx(item_refer.item[idx].$.priority+1,0,5),
            'workingCode' :getNextIdx(item_refer.item[idx].$.workingCode,0,10,2),
            'orderState' : "2",
            'counter' :getNextIdx(item_refer.item[idx].$.counter,0,0,0),
            'batch' :getNextIdx(item_refer.item[idx].$.batch,0,3,1),
        }})
    }

    return DDR_ES56_Obj;
};
function getNextIdx(value, minIdx,maxIdx,increment = 1) {
    if (typeof value !== "string") return value;
    let match = value.match(/^([^\d]*)(\d+)$/);
    if (!match) return value;

    let prefix = match[1];
    let num = parseInt(match[2], 10);
    num = num < maxIdx ? num + increment : minIdx;
    return prefix + String(num).padStart(match[2].length, "0");
};

let dataUploadRequired_ES_10 = async (root) => {
    if (! checkDuR_ES10(root.event[0].dataUploadRequired[0].$)){
        format_returncode(root,0,"Data Upload Required ES_10 Failed")
        return;
    };
    
    //correct instance
    format_returncode(root,0,null)

    //format body
    format_body(root.body)
    
}
let checkDuR_ES10 = (eventAttribute) => {return true;}

let dataUploadRequired_ES_52 = async (root) => {
    if (! checkDuR_ES52(root)){
        return;
    };
    
    //correct instance
    let [orderNo,changeState] = DUR_ES52_parseOrder(root.body[0].items[0].item)
    DUR_ES52_updateES56Obj(DDR_ES56_Obj.body.structArrays[0].array[0].values[0].item,orderNo,changeState);
    format_returncode(root,0,null)

    //format body
    format_body(root.body)
    
}
let checkDuR_ES52 = (root) => {
    let checkOrderNo =  root.body[0].items[0].item?.find(item => item.$.name == "orderNo" );
    if (! checkOrderNo){
        format_returncode(root,-1,"No OrderNo found");
        return false;
    }
    let checkOrderState = root.body[0].items[0].item?.find(item => item.$.name == "orderState" );
    if (! checkOrderState){
        format_returncode(root,-1,"No orderState found");
        return false;
    }
    let checkExistInList = DDR_ES56_Obj.body.structArrays[0].array[0].values[0].item.some(item => item.$.orderNo == checkOrderNo.$.value)
    if (!checkExistInList){
        format_returncode(root,-1,"OrderNo No Existed in List");
        return false;
    }
    return true;
}
let DUR_ES52_parseOrder = (itemArr) => {
    let OrderNoItm = itemArr.find(obj => obj.$.name === "orderNo");
    let OrderStateItm = itemArr.find(obj => obj.$.name === "orderState");

    return [OrderNoItm.$.value,OrderStateItm.$.value]
}
let DUR_ES52_updateES56Obj=  (ES56_Obj_Items,orderNo,changeState) => {
   let index = ES56_Obj_Items.findIndex(obj => obj.$.orderNo === orderNo);
   if (index != -1) { //searched
     if(changeState == '4' || changeState == '10'){
        ES56_Obj_Items.splice(index,1);
     }
     if(changeState == '3' ){
        ES56_Obj_Items[index].$.orderState = 3;
     }
   }
};

//formatting are below
let format_returncode = (root,returncode,err_txt) => {
        
        if (returncode !== 0) root.body[0] = null;
        root.event[0] = {
            "result" : [{
                "$" : {
                    "returnCode" : `${returncode}`,
                }
            }],
            "trace" : returncode==0 ? null :`${err_txt}`
        }; 
} 
let format_body = (body,body_item = null) => {
    if (! body_item) {
       body[0] = null; 
       return;
    }
     body[0] = body_item.body;
};
/**
 * Safely logs a JavaScript object, handling circular references.
 * @param {object} obj The object to be logged.
 * @param {string} [name="Object"] A name for the object in the log output.
 */
function logRecursiveObject(obj, name = "Object") {
  const cache = new Set();
  const serialized = JSON.stringify(obj, (key, value) => {
    // Check if the value is an object and not null
    if (typeof value === 'object' && value !== null) {
      // If we have seen this object before, it's a circular reference
      if (cache.has(value)) {
        return '[Circular]';
      }
      // Otherwise, add the object to the cache
      cache.add(value);
    }
    return value;
  }, 2); // The '2' here adds indentation for readability

  console.log(`\n--- Recursive Log for ${name} ---\n${serialized}\n-------------------------------\n`);
}

// // --- Example Usage ---

// // Example with a circular reference
// const head = { name: 'Head' };
// const child = { name: 'Child', parent: head };
// head.child = child; // Create the circular reference

// logRecursiveObject(head, 'Circular Object');

// // Example with a non-circular object
// const user = {
//   id: 1,
//   data: {
//     username: 'testuser',
//     settings: { theme: 'dark' }
//   }
// };

// logRecursiveObject(user, 'Non-Circular Object');