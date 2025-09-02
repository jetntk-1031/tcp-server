import net from "net";
import { parseStringPromise,Builder } from "xml2js";
// import xmlFormatter from "xml-formatter";

const PORT = 50010;
const HOST = "0.0.0.0";

const builder = new Builder({
  headless: false,   // don’t add <?xml version="1.0"?>
  renderOpts: { pretty: true } // format nicely
});


const server = net.createServer((socket) => {
  console.log(`Client connected: ${socket.remoteAddress}:${socket.remotePort}`);

  socket.on("data", async (data) => {
    // console.log(`data : ${data}`)
    const xmlInput = data.toString().trim();
    try {
        const request = await parseStringPromise(xmlInput);
        await CheckEvent(request);
        
        let formatted_xml = builder.buildObject(request)
        console.log(formatted_xml);
        socket.write(formatted_xml);
 
    } catch (error) {
        let err_txt = `Error : ${error}`
        console.log(err_txt)
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
        if (eventswitch == "10"){
            await dataUploadRequired_ES_10(request.root);
        }
        else if (eventswitch == "52"){
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
        format_returncode(root.event,0,"Part Process Failed")
        return;
    };
    
    //correct instance
    format_returncode(root.event,0,null)
    await PR_ES1_Body().then(Res => {
        format_body(root.body,Res)

    }).catch(error => {
        console.error("Failed to parse:", error.message);
    });
    
}
let checkPR_ES1 = (eventAttribute) => {return true;};

let PR_ES1_Body = async (ProgNm, MagType) => {
    let template = `
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

let partReceived_ES10 = async (root) => {
    if (! checkPR_ES10(root.event[0].partReceived[0].$)){
        format_returncode(root.event,0,"Part Process Failed")
        return;
    };
    
    //correct instance
    format_returncode(root.event,0,null)
    
    let PanelCount = 25;
    let PanelType = "1111111111";
    await PR_ES10_Body(PanelCount,PanelType).then(Res => {
        format_body(root.body,Res)

    }).catch(error => {
        console.error("Failed to parse:", error.message);
    });
}
let checkPR_ES10 = (eventAttribute) => {return true;};
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

let partProcessed_ES1 = async (root) => {
    if (! checkPP_ES1(root.event[0].partProcessed[0].$)){
        format_returncode(root.event,0,"Part Process Failed")
        return;
    };
    
    //correct instance
    format_returncode(root.event,0,null)
    format_body(root.body)
}
let checkPP_ES1 = (eventAttribute) => {return true;};
let partProcessed_ES10 = async (root) => {
    if (! checkPP_ES10(root.event[0].partProcessed[0].$)){
        format_returncode(root.event,0,"Part Process Failed")
        return;
    };
    
    //correct instance
    format_returncode(root.event,0,null)
    format_body(root.body)
}
let checkPP_ES10 = (eventAttribute) => {return true;};

let partProcessed_ES11 = async (root) => {
    if (! checkPP_ES11(root.event[0].partProcessed[0].$)){
        format_returncode(root.event,0,"Part Process Failed")
        return;
    };
    
    //correct instance
    format_returncode(root.event,0,null)
    format_body(root.body)
}
let checkPP_ES11 = (eventAttribute) => {return true;};




let plcChangeOverStarted = async (root) => {
    if (! checkTTNR(root.event[0].plcChangeOverStarted[0].$)){
        format_returncode(root.event,0,"Change Over Started Failed")
        return;
    };
    
    //correct instance
    format_returncode(root.event,0,null)
    format_body(root.body)
}
let checkTTNR = (eventAttribute) => {return true;}

let dataDownloadRequiredES_1 = async (root) => {
    if (! checkDDR_ES1(root.event[0].dataDownloadRequired[0].$)){
        format_returncode(root.event,0,"Data Download Required Failed")
        return;
    };
    
    //correct instance
    format_returncode(root.event,0,null)
    let ProgNm = "1111111111_V01"
    let MagType = "150"
    //format body
    await DDR_ES1_Body(ProgNm,MagType).then(Res => {
        format_body(root.body,Res)

    }).catch(error => {
        console.error("Failed to parse:", error.message);
    });
    
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
        format_returncode(root.event,0,"Data Download Required ES_15 Failed")
        return;
    };
    
    //correct instance
    format_returncode(root.event,0,null)

    //format body
    await DDR_ES15_Body().then(Res => {
        format_body(root.body,Res)

    }).catch(error => {
        console.error("Failed to parse:", error.message);
    });
    
}
let checkDDR_ES15 = (eventAttribute) => {return true;}
let DDR_ES15_Body = async () => {
    let template = `
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
                                <item orderNo="OA1001" priority="1" typeNo="1111111111" typeVar="0001" />
                                <item orderNo="OA1002" priority="2" typeNo="1111111111" typeVar="0001" />
                                <item orderNo="OA1003" priority="3" typeNo="1111111111" typeVar="0001" />
                                <item orderNo="OA1004" priority="4" typeNo="1111111111" typeVar="0001" />
                                <item orderNo="OA1005" priority="5" typeNo="1111111111" typeVar="0001" />
                            </values>
                        </array>
                    </structArrays>
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



let dataDownloadRequiredES_56 = async (root) => {
    if (! checkDDR_ES56(root.event[0].dataDownloadRequired[0].$)){
        format_returncode(root.event,0,"Data Download Required ES_56 Failed")
        return;
    };
    
    //correct instance
    format_returncode(root.event,0,null)

    //format body
    await DDR_ES56_Body().then(Res => {
        format_body(root.body,Res)

    }).catch(error => {
        console.error("Failed to parse:", error.message);
    });
    
}
let checkDDR_ES56 = (eventAttribute) => {return true;}
let DDR_ES56_Body = async () => {
    let template = `
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
                                <item orderNo="OA1001" quantity="100" typeNo="1111111111" typeVar="0001" priority="1" workingCode="0" orderState="3" counter="4" batch="" />
                                <item orderNo="OA1002" quantity="99" typeNo="1111111111" typeVar="0001" priority="2" workingCode="0" orderState="2" counter="0" batch="" />
                                <item orderNo="OA1003" quantity="100" typeNo="1111111111" typeVar="0001" priority="3" workingCode="0" orderState="2" counter="0" batch="" />
                                <item orderNo="OA1004" quantity="100" typeNo="1111111111" typeVar="0001" priority="4" workingCode="0" orderState="2" counter="0" batch="" />
                                <item orderNo="OA1005" quantity="100" typeNo="1111111111" typeVar="0001" priority="5" workingCode="0" orderState="2" counter="0" batch="" />
                            </values>
                        </array>
                    </structArrays>
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

let dataUploadRequired_ES_10 = async (root) => {
    if (! checkDuR_ES10(root.event[0].dataUploadRequired[0].$)){
        format_returncode(root.event,0,"Data Upload Required ES_10 Failed")
        return;
    };
    
    //correct instance
    format_returncode(root.event,0,null)

    //format body
    format_body(root.body)
    
}
let checkDuR_ES10 = (eventAttribute) => {return true;}

let dataUploadRequired_ES_52 = async (root) => {
    if (! checkDuR_ES52(root.event[0].dataUploadRequired[0].$)){
        format_returncode(root.event,0,"Data Upload Required ES_52 Failed")
        return;
    };
    
    //correct instance
    format_returncode(root.event,0,null)

    //format body
    format_body(root.body)
    
}
let checkDuR_ES52 = (eventAttribute) => {return true;}


//formatting are below
let format_returncode = (evt,returncode,err_txt) => {
         evt[0] = {
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