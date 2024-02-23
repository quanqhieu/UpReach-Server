const _ = require('lodash');
// Get Array Dataa Influencer to Object
const formatResponseInfluencerToObject = (payload) => {
    const formatValue = payload.reduce(
        ( _accumulator, currentValue) => {
            return {
                ...currentValue,
                influencerTypeName: [...new Set(payload.map((e) => e.influencerTypeName))] ,
                influencerContentTopicName: [...new Set(payload.map((e) => e.influencerContentTopicName))],
                influencerContentFormatName: [...new Set(payload.map((e) => e.influencerContentFormatName))] ,
                audienceLocation: [...new Set(payload.map((e) => e.audienceLocation))],
            }
        },
        {}
    );
    return formatValue;
}

const formatResponseUserToObject = (payload) => {
    const formatValue = payload.reduce(
        ( _accumulator, currentValue) => {
            return {
                ...currentValue
            }
        },
        {}
    );
return formatValue;
}

// Get Array Dataa Client to Object
const formatResponseClientToObject = (payload) => {
    const formatValue = payload.reduce(
        ( _accumulator, currentValue) => {
            return {
                ...currentValue,
                nameListOfClients: [...new Set(payload.map((e) => e.nameListOfClients))] 
            }
        },
        {}
    );
    return formatValue;
}

// Get Array Data Influencer with not duplicate
function formatResponseInfluencerToArray(data) {
    const result = [];
    const kolGroups = {};

    data.forEach((item) => {
        const kolId = item["influencerId"];
        if (!kolGroups[kolId]) {
            kolGroups[kolId] = { ...item };
            kolGroups[kolId]["influencerTypeName"] = new Set([item["influencerTypeName"]]);
            kolGroups[kolId]["influencerContentTopicName"] = new Set([item["influencerContentTopicName"]]);
            kolGroups[kolId]["influencerContentFormatName"] = new Set([item["influencerContentFormatName"]]);
            kolGroups[kolId]["audienceLocation"] = new Set([item["audienceLocation"]]);
            kolGroups[kolId]["audienceGender"] = new Set([item["audienceGender"]]);
            kolGroups[kolId]["AudienceAgeList"] = new Set([item["AudienceAgeList"]]);
            kolGroups[kolId]["AudienceFollowerList"] = new Set([item["AudienceFollowerList"]]);
            kolGroups[kolId]["AudienceFollowerMonth"] = new Set([item["AudienceFollowerMonth"]]);
            kolGroups[kolId]["AudiencerLocation"] = new Set([item["AudiencerLocation"]]);
            kolGroups[kolId]["dataImage"] = [];

        } else {
            kolGroups[kolId]["influencerTypeName"].add(item["influencerTypeName"]);
            kolGroups[kolId]["influencerContentTopicName"].add(item["influencerContentTopicName"]);
            kolGroups[kolId]["influencerContentFormatName"].add(item["influencerContentFormatName"]);
            kolGroups[kolId]["audienceLocation"].add(item["audienceLocation"]);
            kolGroups[kolId]["audienceGender"].add(item["audienceGender"]);
            kolGroups[kolId]["AudienceAgeList"].add(item["AudienceAgeList"]);
            kolGroups[kolId]["AudienceFollowerList"].add(item["AudienceFollowerList"]);
            kolGroups[kolId]["AudienceFollowerMonth"].add(item["AudienceFollowerMonth"]);
            kolGroups[kolId]["AudiencerLocation"].add(item["AudiencerLocation"]);
        }
        const uid = item["Image_ID"];
        const url = item["Image"];
        const existingImage = kolGroups[kolId]["dataImage"].find(img => img.uid === uid);

        if (!existingImage) {
            kolGroups[kolId]["dataImage"].push({ uid, url });
        }
        });

    for (const kolId in kolGroups) {
    const kolData = kolGroups[kolId];
    kolData["dataImage"] = Array.from(kolData["dataImage"]);
    kolData["influencerTypeName"] = Array.from(kolData["influencerTypeName"]);
    kolData["influencerContentTopicName"] = Array.from(kolData["influencerContentTopicName"]);
    kolData["influencerContentFormatName"] = Array.from(kolData["influencerContentFormatName"]);
    kolData["audienceLocation"] = Array.from(kolData["audienceLocation"]);
    kolData["audienceGender"] = Array.from(kolData["audienceGender"]);
    kolData["AudienceAgeList"] = Array.from(kolData["AudienceAgeList"]);
    kolData["AudienceFollowerList"] = Array.from(kolData["AudienceFollowerList"]);
    kolData["AudienceFollowerMonth"] = Array.from(kolData["AudienceFollowerMonth"]);
    kolData["AudiencerLocation"] = Array.from(kolData["AudiencerLocation"]);
    result.push(kolData);
    }
    
    return result;
}

function formatResponseInfluencerToArray(data) {
    const result = [];
    const kolGroups = {};

    data.forEach((item) => {
        const kolId = item["influencerId"];
        if (!kolGroups[kolId]) {
            kolGroups[kolId] = { ...item };
            kolGroups[kolId]["influencerTypeName"] = new Set([item["influencerTypeName"]]);
            kolGroups[kolId]["influencerContentTopicName"] = new Set([item["influencerContentTopicName"]]);
            kolGroups[kolId]["influencerContentFormatName"] = new Set([item["influencerContentFormatName"]]);
            kolGroups[kolId]["audienceLocation"] = new Set([item["audienceLocation"]]);
            kolGroups[kolId]["audienceGender"] = new Set([item["audienceGender"]]);
            kolGroups[kolId]["AudienceAgeList"] = new Set([item["AudienceAgeList"]]);
            kolGroups[kolId]["AudienceFollowerList"] = new Set([item["AudienceFollowerList"]]);
            kolGroups[kolId]["AudienceFollowerMonth"] = new Set([item["AudienceFollowerMonth"]]);
            kolGroups[kolId]["AudiencerLocation"] = new Set([item["AudiencerLocation"]]);
            kolGroups[kolId]["dataImage"] = [];

        } else {
            kolGroups[kolId]["influencerTypeName"].add(item["influencerTypeName"]);
            kolGroups[kolId]["influencerContentTopicName"].add(item["influencerContentTopicName"]);
            kolGroups[kolId]["influencerContentFormatName"].add(item["influencerContentFormatName"]);
            kolGroups[kolId]["audienceLocation"].add(item["audienceLocation"]);
            kolGroups[kolId]["audienceGender"].add(item["audienceGender"]);
            kolGroups[kolId]["AudienceAgeList"].add(item["AudienceAgeList"]);
            kolGroups[kolId]["AudienceFollowerList"].add(item["AudienceFollowerList"]);
            kolGroups[kolId]["AudienceFollowerMonth"].add(item["AudienceFollowerMonth"]);
            kolGroups[kolId]["AudiencerLocation"].add(item["AudiencerLocation"]);
        }
        const uid = item["Image_ID"];
        const url = item["Image"];
        const existingImage = kolGroups[kolId]["dataImage"].find(img => img.uid === uid);

        if (!existingImage) {
            kolGroups[kolId]["dataImage"].push({ uid, url });
        }
        });

    for (const kolId in kolGroups) {
    const kolData = kolGroups[kolId];
    kolData["dataImage"] = Array.from(kolData["dataImage"]);
    kolData["influencerTypeName"] = Array.from(kolData["influencerTypeName"]);
    kolData["influencerContentTopicName"] = Array.from(kolData["influencerContentTopicName"]);
    kolData["influencerContentFormatName"] = Array.from(kolData["influencerContentFormatName"]);
    kolData["audienceLocation"] = Array.from(kolData["audienceLocation"]);
    kolData["audienceGender"] = Array.from(kolData["audienceGender"]);
    kolData["AudienceAgeList"] = Array.from(kolData["AudienceAgeList"]);
    kolData["AudienceFollowerList"] = Array.from(kolData["AudienceFollowerList"]);
    kolData["AudienceFollowerMonth"] = Array.from(kolData["AudienceFollowerMonth"]);
    kolData["AudiencerLocation"] = Array.from(kolData["AudiencerLocation"]);
    result.push(kolData);
    }
    
    return result;
}
// Get Array Data Client with not duplicate
function formatResponseClientToArray(data) {
    const result = [];
    const clientGroup = {};

    data.forEach((item) => {
    const clients = item["clientId"];
    if (!clientGroup[clients]) {
        clientGroup[clients] = { ...item };
        clientGroup[clients]["nameListOfClients"] = new Set([item["nameListOfClients"]]);
    } else {
        clientGroup[clients]["nameListOfClients"].add(item["nameListOfClients"]);
    }
    });

    for (const  clientId in clientGroup) {
    const clientData = clientGroup[clientId];
    clientData["nameListOfClients"] = Array.from(clientData["nameListOfClients"]);
    result.push(clientData);
    }
    
    return result;
}

function formatDataHistoryReports(data) {
    const result = [];
    const clientGroup = {};

    data.forEach((item) => {
    const clients = item["kolsId"];
    if (!clientGroup[clients]) {
        clientGroup[clients] = { ...item };
        clientGroup[clients]["influencerTypeName"] = new Set([item["influencerTypeName"]]);
        clientGroup[clients]["influencerContentTopicName"] = new Set([item["influencerContentTopicName"]]);
        clientGroup[clients]["influencerContentFormatName"] = new Set([item["influencerContentFormatName"]]);
        clientGroup[clients]["dataImage"] = [];
    } else {
        clientGroup[clients]["influencerTypeName"].add(item["influencerTypeName"]);
        clientGroup[clients]["influencerContentTopicName"].add(item["influencerContentTopicName"]);
        clientGroup[clients]["influencerContentFormatName"].add(item["influencerContentFormatName"]);
    }

    // Add dataImage to the clientGroup
    const uid = item["Image_ID"];
        const url = item["Image"];
        const existingImage = clientGroup[clients]["dataImage"].find(img => img.uid === uid);

        if (!existingImage) {
            clientGroup[clients]["dataImage"].push({ uid, url });
        }
    });

    for (const  clientId in clientGroup) {
    const clientData = clientGroup[clientId];
    clientData["influencerTypeName"] = Array.from(clientData["influencerTypeName"]);
    clientData["influencerContentTopicName"] = Array.from(clientData["influencerContentTopicName"]);
    clientData["influencerContentFormatName"] = Array.from(clientData["influencerContentFormatName"]);
    result.push(clientData);
    }
    
    return result;
}

function formatChartDataInfluencer(data) {
    const dataChartGroup = {};

    _.forEach(data, (item) => {
        const influencerId = item["influencerId"];

        if (!dataChartGroup[influencerId]) {
            dataChartGroup[influencerId] = {
                "influencerId": influencerId,
                "dataFollower": [],
                "dataGender": [],
                "dataAge": [],
                "dataLocation": [],
                "dataJob": []
            };
        }

        dataChartGroup[influencerId]["dataFollower"].push({
            "monthFollow": item["monthFollowAudiencer"],
            "value": item["quantityFollowerAudiencer"]
        });

        dataChartGroup[influencerId]["dataGender"].push({
            "sex": item["genderAudiencer"],
            "value": item["quantityGenderAudiencer"]
        });

        dataChartGroup[influencerId]["dataAge"].push({
            "type": item["ageRange"],
            "value": item["quantityAgeRangeAudiencer"]
        });

        dataChartGroup[influencerId]["dataLocation"].push({
            "type": item["locationAudiencer"],
            "value": item["quantityLocationAudiencer"]
        });

        // Thay đổi ở đây: Gộp các công việc có cùng jobId
        const jobId = item["idJob"];
        const existingJob = dataChartGroup[influencerId]["dataJob"].find(job => job["jobId"] === jobId);
        if (existingJob) {
            if (!existingJob["clientId"].includes(item["idClient"])) {
                existingJob["clientId"].push(item["idClient"]);
            }
        } else {
            dataChartGroup[influencerId]["dataJob"].push({
                "jobId": jobId,
                "clientBookingId": item["idClientBooking"],
                "clientId": [item["idClient"]],
                "jobName": item["nameJob"],
                "jobPlatform": item["platformJob"],
                "costForm": item["costForm"],
                "costTo": item["costTo"],
                "quantityNumberWork": item["quantityNumberWork"],
                "linkJob": item["linkJob"],
                "describes": item["describes"],
                "startDate": item["startDate"],
                "endDate": item["endDate"],
                "statusId": item["statusId"],
                "formatid": item["formatid"],
                "isPublish": item["isPublish"]
                
                // Các trường dữ liệu khác như trong mã gốc
            });
        }
    });

    const result = _.values(dataChartGroup);

    _.forEach(result, (item) => {
        item["dataFollower"] = _.uniqBy(item["dataFollower"], "monthFollow");
        item["dataGender"] = _.uniqBy(item["dataGender"], "sex");
        item["dataAge"] = _.uniqBy(item["dataAge"], "type");
        item["dataLocation"] = _.uniqBy(item["dataLocation"], "type");
        item["dataJob"] = _.uniqBy(item["dataJob"], "jobId");
    });

    return result;
}

function increaseID(lastId) {
    try{
        const wordChar= lastId.match(/[A-Za-z]+/)[0]; // Tách phần chữ ra khỏi mã
        const numChar = parseInt(lastId.match(/\d+/)[0]); // Tách phần số và chuyển sang số nguyên
    
        const newNum = numChar + 1; // Tăng phần số lên 1
    
        // Định dạng lại phần số để có độ dài tương tự
        const newString = newNum.toString().padStart(lastId.length - wordChar.length, '0');
    
        const newId = wordChar + newString; // Kết hợp phần chữ và phần số mới
    
        return newId;
    }catch(e){
        console.log(e)
    }
    
}


module.exports = {formatDataHistoryReports,formatChartDataInfluencer,formatResponseInfluencerToObject,formatResponseUserToObject,formatResponseInfluencerToArray,formatResponseClientToArray,formatResponseClientToObject,increaseID}