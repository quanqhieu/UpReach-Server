const express = require("express");
const passport = require("passport");
const cloudinary = require("cloudinary").v2;
const config = require("../../Config/dbConfig");
const sql = require("mssql");
const _ = require('lodash');
const auth = require("../../Authen/auth");
const userModels = require("../User/UserController");
const influService = require("../../Service/Influencer/InfluencerService")
const userService = require("../../Service/User/UserService")
const common = require("../../../../common/common");
const influModel = require("../../Model/MogooseSchema/influModel");
const router = express.Router();
const { getUserByEmail } = require("../../Service/User/UserService");
const { lte } = require("lodash");
const clientModel = require("../../Model/MogooseSchema/clientModel");


auth.initialize(
  passport,
  (id) => userModels.find((user) => user.userId === id),
  (email) => userModels.find((user) => user.userEmail === email)
);

const isObjectEmpty = (objectName) => {
  return _.isEmpty(objectName);
};

async function updateInfo(req, res, next) {
  try {
    const influ = JSON.parse(req.body.influ);
    const booking = JSON.parse(req.body.booking);
    const chart = JSON.parse(req.body.chart);
    const idRemoveArray = JSON.parse(req.body.idRemove);
    const editDate = JSON.parse(req.body.editDate);
    const uploadedImages = [];
    if (influ.dataImage) {
      for (const image of influ.dataImage) {
        if (image.thumbUrl) {
          const img = await cloudinary.uploader.upload(image.thumbUrl, {
            public_id: image.uid,
            resource_type: "auto",
          });

          uploadedImages.push({ 
            userId: influ.userId,
            id: image.uid,
            url: img.url,
          });
        } else
          uploadedImages.push({
            userId: influ.userId,
            id: image.uid,
            url: image.url,
          });
      }
      influ.dataImage = uploadedImages;
    }

    sql.connect(config, (err) => {
      if (err) {
        console.log(err);
        return res.json({ message: " " + err });
      }
      const request = new sql.Request();
      request.query(
        "SELECT * FROM [UpReachDB].[dbo].[KOLs]",
        async (error, response) => {
          if (error) {
            console.log(error);
            return res.json({ message: " " + err });
          }
          const influs = [...response.recordset];

          const filteredData = influs.find(
            (item) => item.User_ID === influ.userId
          );

          if (filteredData) {
            if (filteredData.isPublish) {
              const kolsId = 'INF' + (Math.floor(Math.random() * 100000).toString().padStart(5, '0'));
              const platformId = 'IPF' + (Math.floor(Math.random() * 100000).toString().padStart(5, '0'));
              const profileId = 'IPR' + (Math.floor(Math.random() * 100000).toString().padStart(5, '0'));
         
              await request.query(`
            BEGIN
            INSERT INTO [UpReachDB].[dbo].[PlatformInformation]
            (Platform_ID, Follow_FB, Interaction_FB, Follow_Insta, Interaction_Insta, Follow_Youtube, Interaction_Youtube, Follow_Tiktok, Interaction_Tiktok, Engagement, Postsperweek)
            VALUES ('${platformId}', '${influ.influencerFollowFb}', '${influ.influencerInteractionFb}', '${influ.influencerFollowInsta}', '${influ.influencerInteractionInsta}', '${influ.influencerFollowYoutube}', '${influ.influencerInteractionYoutube}', '${influ.influencerFollowTikTok}', '${influ.influencerInteractionTiktok}', '${influ.influencerEngagement}', '${influ.influencerPostsPerWeek}')
            END
            `);

              await request.query(`
            BEGIN
            INSERT INTO [UpReachDB].[dbo].[Profile]
            (Profile_ID, fullName, NickName, Email, Age, Phone, Gender, Bio, Address, isAccepted,Relationship, CostEstimateFrom, CostEstimateTo, Followers)
            VALUES ('${profileId}', N'${influ.influencerfullName}', N'${influ.influencerNickName}', '${influ.influencerEmail}', '${influ.influencerAge}', '${influ.influencerPhone}', '${influ.influencerGender}', N'${influ.influencerBio}', N'${influ.influencerAddress}', '1',N'${influ.influencerRelationship}', '${influ.influencerCostEstimateFrom}', '${influ.influencerCostEstimateTo}', '${influ.influencerFollowers}')
            END
            `);

              await request.query(`
              BEGIN
                INSERT INTO [UpReachDB].[dbo].[KOLs]
                (KOLs_ID, Profile_ID, Platform_ID, User_ID, isPublish, Date_edit )
                VALUES ('${kolsId}', '${profileId}', '${platformId}', '${filteredData.User_ID}', '0', '${editDate}')
              END
            `);

              await request.query(`
                BEGIN
                    DELETE FROM [UpReachDB].[dbo].[ImageKOLs]
                    WHERE Profile_ID = '${profileId}'
                END
              `);

              for (let i = 0; i < uploadedImages.length; i++) {
                const imageObject = uploadedImages[i];
                const imageId = 'IMG' + (Math.floor(Math.random() * 100000).toString().padStart(5, '0'));

                request.input("imageId" + i, sql.NVarChar, imageId);
                request.input("profileId" + i, sql.NVarChar, profileId);
                request.input("imageUrl" + i, sql.NVarChar, imageObject.url);


                request.query(`
                BEGIN
                    INSERT INTO [UpReachDB].[dbo].[ImageKOLs]
                    (Image_ID, Profile_ID, Image)
                    VALUES (@imageId${i}, @profileId${i}, @imageUrl${i})
                END
                    `);
              }

              if (chart.dataFollower && Array.isArray(chart.dataFollower)) {
                for (let i = 0; i < chart.dataFollower.length; i++) {
                  const followerListId = 'AFML' + (Math.floor(Math.random() * 100000).toString().padStart(5, '0'));

                  const dataFollowerObject = chart.dataFollower[i];
                  const date = dataFollowerObject.date;
                  const quantity = dataFollowerObject.value;
                  await request.query(`
            BEGIN
              INSERT INTO [UpReachDB].[dbo].[AudienceFollowerMonthList]
              (AudienceFollowerMonthList_ID, AudienceFollowerMonth, Platform_ID, Quantity )
              VALUES ('${followerListId}', '${date}', '${platformId}', '${quantity}')
            END
            `);
                }
              }

              if (chart.dataGender && Array.isArray(chart.dataGender)) {
                const genderIdConvert = new Map([
                  ["Male", "AG001"],
                  ["Female", "AG002"],
                ]);
                for (let i = 0; i < chart.dataGender.length; i++) {
                  const genderListId = 'AGL' + (Math.floor(Math.random() * 100000).toString().padStart(5, '0'));

                  const dataGenderObject = chart.dataGender[i];
                  const genderId = genderIdConvert.get(dataGenderObject.sex);
                  const quantity = dataGenderObject.value;

                  await request.query(`
            BEGIN
              INSERT INTO [UpReachDB].[dbo].[AudienceGenderList]
              (AudienceGenderList_ID, AudienceGenderId, Platform_ID, Quantity )
              VALUES ('${genderListId}', '${genderId}', '${platformId}', '${quantity}')
            END
            `);
                }
              }

              if (chart.dataAge && Array.isArray(chart.dataAge)) {
                const ageIdConvert = new Map([
                  ["0-18", "AAI001"],
                  ["19-25", "AAI002"],
                  ["26-40", "AAI003"],
                  ["41-60", "AAI004"],
                ]);
                for (let i = 0; i < chart.dataAge.length; i++) {
                  const ageListId = 'AARL' + (Math.floor(Math.random() * 100000).toString().padStart(5, '0'));

                  const dataAgeObject = chart.dataAge[i];
                  const ageId = ageIdConvert.get(dataAgeObject.age);
                  const quantity = dataAgeObject.value;

                  await request.query(`
            BEGIN
              INSERT INTO [UpReachDB].[dbo].[AudienceAgeRangeList]
              (AudienceAgeList_ID, AudienceAge_ID, Platform_ID, Quantity )
              VALUES ('${ageListId}', '${ageId}', '${platformId}', '${quantity}')
            END
            `);
                }
              }

              if (chart.dataLocation && Array.isArray(chart.dataLocation)) {
                for (let i = 0; i < chart.dataLocation.length; i++) {
                  const locationListId = 'IALL' + (Math.floor(Math.random() * 100000).toString().padStart(5, '0'));

                  const dataLocationObject = chart.dataLocation[i];
                  const location = dataLocationObject.location;
                  const quantity = dataLocationObject.value;
                  await request.query(`
            BEGIN
              INSERT INTO [UpReachDB].[dbo].[AudienceLocationList]
              (AudienceLocationList_ID, AudienceLocation, Platform_ID, Quantity )
              VALUES ('${locationListId}', N'${location}', '${platformId}', '${quantity}')
            END
            `);
                }
              }

              const jobIds = [];
              for (let i = 0; i < booking?.length; i++) {
                const bookingJob = booking[i];
                const jobId = 'IJ' + (Math.floor(Math.random() * 100000).toString().padStart(5, '0'));
                const formatListId = 'JCFL' + (Math.floor(Math.random() * 100000).toString().padStart(5, '0'));

                jobIds.push(jobId);

                request.input("jobId" + i, sql.NVarChar, jobId);
                request.input("jobName" + i, sql.NVarChar, bookingJob.jobName);
                request.input(
                  "platform" + i,
                  sql.NVarChar,
                  bookingJob.platform
                );
                request.input(
                  "costEstimateFrom" + i,
                  sql.Float,
                  bookingJob.costEstimateFrom
                );
                request.input(
                  "costEstimateTo" + i,
                  sql.Float,
                  bookingJob.costEstimateTo
                );
                request.input("quantity" + i, sql.Int, bookingJob.quantity);
                request.input("jobLink" + i, sql.NVarChar, bookingJob.jobLink);

                await request.query(`
                          BEGIN
                            INSERT INTO [UpReachDB].[dbo].[InfluencerJob]
                            (Job_ID, Name_Job, Platform_Job, CostEstimate_From_Job, CostEstimate_To_Job, Quantity, Link)
                            VALUES (@jobId${i}, @jobName${i}, @platform${i}, @costEstimateFrom${i}, @costEstimateTo${i}, @quantity${i}, @jobLink${i})
                          END
                        `);

                request.input("formatListId" + i, sql.NVarChar, formatListId);
                request.input("formatContent" + i, sql.NVarChar, bookingJob.formatContent);

                await request.query(`
                            BEGIN
                              INSERT INTO [UpReachDB].[dbo].[JobContentFormatList]
                              (FormatListJob_ID, Job_ID, Format_Id)
                              VALUES (@formatListId${i}, @jobId${i}, @formatContent${i})
                            END
                          `);

              }


              for (let i = 0; i < jobIds?.length; i++) {
                const jobId = jobIds[i];
                const jobListId = 'IJL' + (Math.floor(Math.random() * 100000).toString().padStart(5, '0'));

                request.input("jobListId" + i, sql.NVarChar, jobListId);

                await request.query(`
                          
                          BEGIN
                              INSERT INTO [UpReachDB].[dbo].[InfluencerJobList]
                              (JobList_ID, Job_ID, Profile_ID, isPublish)
                              VALUES (@jobListId${i}, '${jobId}', '${profileId}', 1)
                              END
                              `);
              }

              //------------------------Update False Report----------------------------------
            } else {
              await request.query(`
              BEGIN
                UPDATE [UpReachDB].[dbo].[KOLs]
                SET Date_edit = '${editDate}'
                WHERE Profile_ID = '${filteredData.Profile_ID}'
              END
            `);
              await request.query(`
            BEGIN
                DELETE FROM [UpReachDB].[dbo].[ImageKOLs]
                WHERE Profile_ID = '${filteredData.Profile_ID}'
              END
            `);

              for (let i = 0; i < uploadedImages.length; i++) {
                const imageObject = uploadedImages[i];
                const imageId = 'IMG' + (Math.floor(Math.random() * 100000).toString().padStart(5, '0'));

                request.input("imageId" + i, sql.NVarChar, imageId);
                request.input("imageUrl" + i, sql.NVarChar, imageObject.url);
                request.input("profileId" + i, sql.NVarChar, filteredData.Profile_ID);

                request.query(`
                BEGIN
                    INSERT INTO [UpReachDB].[dbo].[ImageKOLs]
                    (Image_ID, Profile_ID, Image)
                    VALUES (@imageId${i}, @profileId${i}, @imageUrl${i})
                END
                    `);
              }

              await request.query(`
            BEGIN
            UPDATE [UpReachDB].[dbo].[PlatformInformation]
            SET       
               Follow_FB = ${influ.influencerFollowFb},
               Interaction_FB = ${influ.influencerInteractionFb},
               Follow_Insta = ${influ.influencerFollowInsta},
               Interaction_Insta = ${influ.influencerInteractionInsta},
               Follow_Youtube = ${influ.influencerFollowYoutube},
               Interaction_Youtube = ${influ.influencerInteractionYoutube},
               Follow_TikTok = ${influ.influencerFollowTikTok},
               Interaction_Tiktok = ${influ.influencerInteractionTiktok},
               Engagement = ${influ.influencerEngagement},
               PostsPerWeek = ${influ.influencerPostsPerWeek}
               WHERE Platform_ID = '${filteredData.Platform_ID}'
            END
            BEGIN
                UPDATE [UpReachDB].[dbo].[Profile]
                SET CostEstimateFrom = ${influ.influencerCostEstimateFrom},
                    CostEstimateTo = ${influ.influencerCostEstimateTo},
                    Followers = ${influ.influencerFollowers}
                WHERE Profile_ID = '${filteredData.Profile_ID}'
            END
            `);

              for (let i = 0; i < booking.length; i++) {
                const bookingJob = booking[i];
                //--------------------------Update Job Exist ------------------------------------
                if (bookingJob?.jobId) {
                  request.input("jobId" + i, sql.NVarChar, bookingJob.jobId);
                  request.input("jobName" + i, sql.NVarChar, bookingJob.jobName);
                  request.input("platform" + i, sql.NVarChar, bookingJob.platform);
                  request.input(
                    "costEstimateFrom" + i,
                    sql.Int,
                    bookingJob.costEstimateFrom
                  );
                  request.input(
                    "costEstimateTo" + i,
                    sql.Int,
                    bookingJob.costEstimateTo
                  );
                  request.input("quantity" + i, sql.Int, bookingJob.quantity);
                  request.input("jobLink" + i, sql.NVarChar, bookingJob.jobLink);

                  request.input("formatContent" + i, sql.NVarChar, bookingJob.formatContent);

                  request.query(`
                        BEGIN
                          UPDATE [UpReachDB].[dbo].[InfluencerJob]
                          SET Name_Job = @jobName${i}, Platform_Job = @platform${i}, CostEstimate_From_Job = @costEstimateFrom${i}, CostEstimate_To_Job = @costEstimateTo${i}, Quantity = @quantity${i}, Link = @jobLink${i}
                          WHERE Job_ID = @jobId${i}
                        END
                      `);
                  request.query(`
                        BEGIN
                          UPDATE [UpReachDB].[dbo].[JobContentFormatList]
                          SET Format_Id = @formatContent${i}
                          WHERE Job_ID = @jobId${i}
                        END
                      `);

                  //--------------------------Update Job New ------------------------------------

                } else {
                  const jobId = 'IJ' + (Math.floor(Math.random() * 100000).toString().padStart(5, '0'));
                  const jobListId = 'IJL' + (Math.floor(Math.random() * 100000).toString().padStart(5, '0'));
                  const formatListId = 'JCFL' + (Math.floor(Math.random() * 100000).toString().padStart(5, '0'));


                  request.input("jobId" + i, sql.NVarChar, jobId);
                  request.input("jobName" + i, sql.NVarChar, bookingJob.jobName);
                  request.input("platform" + i, sql.NVarChar, bookingJob.platform);
                  request.input("costEstimateFrom" + i, sql.Int, bookingJob.costEstimateFrom);
                  request.input("costEstimateTo" + i, sql.Int, bookingJob.costEstimateTo);
                  request.input("quantity" + i, sql.Int, bookingJob.quantity);
                  request.input("jobLink" + i, sql.NVarChar, bookingJob.jobLink);

                  request.input("jobListId" + i, sql.NVarChar, jobListId);

                  await request.query(`
                        BEGIN
                          INSERT INTO [UpReachDB].[dbo].[InfluencerJob]
                          (Job_ID, Name_Job, Platform_Job, CostEstimate_From_Job, CostEstimate_To_Job, Quantity, Link)
                          VALUES (@jobId${i}, @jobName${i}, @platform${i}, @costEstimateFrom${i}, @costEstimateTo${i}, @quantity${i}, @jobLink${i})
                        END
                              `);

                  await request.query(`
                        BEGIN
                          INSERT INTO [UpReachDB].[dbo].[InfluencerJobList]
                          (JobList_ID, Job_ID, Profile_ID, isPublish)
                          VALUES (@jobListId${i}, @jobId${i}, '${filteredData.Profile_ID}', 1)
                        END
                              `);

                  request.input("formatListId" + i, sql.NVarChar, formatListId);
                  request.input("formatContent" + i, sql.NVarChar, bookingJob.formatContent);

                  await request.query(`
                        BEGIN
                        INSERT INTO [UpReachDB].[dbo].[JobContentFormatList]
                        (FormatListJob_ID, Job_ID, Format_Id)
                        VALUES (@formatListId${i}, @jobId${i}, @formatContent${i})
                    END
                              `);

                }
              }

              for (const jobIdToRemove of idRemoveArray) {
                const newRequest = new sql.Request();

                newRequest.input("jobIdToRemove", sql.NVarChar, jobIdToRemove);

                await newRequest.query(
                  `
                    DELETE FROM [UpReachDB].[dbo].[InfluencerJobList]
                    WHERE Job_ID = @jobIdToRemove
                `
                );

                await newRequest.query(
                  `
                    DELETE FROM [UpReachDB].[dbo].[JobContentFormatList]
                    WHERE Job_ID = @jobIdToRemove
                `
                );

                await newRequest.query(
                  `
                    DELETE FROM [UpReachDB].[dbo].[InfluencerJob]
                    WHERE Job_ID = @jobIdToRemove
                `
                );
              }

              if (chart.dataFollower && Array.isArray(chart.dataFollower)) {
                for (let i = 0; i < chart.dataFollower.length; i++) {
                  const followerListId = 'AFML' + (Math.floor(Math.random() * 100000).toString().padStart(5, '0'));

                  const dataFollowerObject = chart.dataFollower[i];
                  const date = dataFollowerObject.date;
                  const quantity = dataFollowerObject.value;
                  await request.query(`
                    BEGIN
                      INSERT INTO [UpReachDB].[dbo].[AudienceFollowerMonthList]
                      (AudienceFollowerMonthList_ID, AudienceFollowerMonth, Platform_ID, Quantity )
                      VALUES ('${followerListId}', '${date}', '${filteredData.Platform_ID}', '${quantity}')
                    END
                    `);
                }
              }

              if (chart.dataGender && Array.isArray(chart.dataGender)) {
                const genderIdConvert = new Map([
                  ["Male", "AG001"],
                  ["Female", "AG002"],
                ]);
                for (let i = 0; i < chart.dataGender.length; i++) {
                  const genderListId = 'AGL' + (Math.floor(Math.random() * 100000).toString().padStart(5, '0'));

                  const dataGenderObject = chart.dataGender[i];
                  const genderId = genderIdConvert.get(dataGenderObject.sex);
                  const quantity = dataGenderObject.value;

                  await request.query(`
                    BEGIN
                      INSERT INTO [UpReachDB].[dbo].[AudienceGenderList]
                      (AudienceGenderList_ID, AudienceGenderId, Platform_ID, Quantity )
                      VALUES ('${genderListId}', '${genderId}', '${filteredData.Platform_ID}', '${quantity}')
                    END
                    `);
                }
              }

              if (chart.dataAge && Array.isArray(chart.dataAge)) {
                const ageIdConvert = new Map([
                  ["0-18", "AAI001"],
                  ["19-25", "AAI002"],
                  ["26-40", "AAI003"],
                  ["41-60", "AAI004"],
                ]);
                for (let i = 0; i < chart.dataAge.length; i++) {
                  const ageListId = 'AARL' + (Math.floor(Math.random() * 100000).toString().padStart(5, '0'));
                  const dataAgeObject = chart.dataAge[i];
                  const ageId = ageIdConvert.get(dataAgeObject.age);
                  const quantity = dataAgeObject.value;

                  await request.query(`
                    BEGIN
                      INSERT INTO [UpReachDB].[dbo].[AudienceAgeRangeList]
                      (AudienceAgeList_ID, AudienceAge_ID, Platform_ID, Quantity )
                      VALUES ('${ageListId}', '${ageId}', '${filteredData.Platform_ID}', '${quantity}')
                    END
                    `);
                }
              }

              if (chart.dataLocation && Array.isArray(chart.dataLocation)) {
                for (let i = 0; i < chart.dataLocation.length; i++) {
                  const locationListId = 'IALL' + (Math.floor(Math.random() * 100000).toString().padStart(5, '0'));

                  const dataLocationObject = chart.dataLocation[i];
                  const location = dataLocationObject.location;
                  const quantity = dataLocationObject.value;
                  await request.query(`
                    BEGIN
                      INSERT INTO [UpReachDB].[dbo].[AudienceLocationList]
                      (AudienceLocationList_ID, AudienceLocation, Platform_ID, Quantity )
                      VALUES ('${locationListId}', N'${location}', '${filteredData.Platform_ID}', '${quantity}')
                    END
                    `);
                }
              }
            }
          }

          return res.status(201).json({
            message: "Update Successfully",
            date: editDate,
            // sideBar: 
          });
        }
      );
    });
  } catch (err) {
    console.log(err);
    return res.json({ message: " " + err });
  }
}

async function getAllInfluencer(req, res, next) {
  try {
    const page = parseInt(req.query.page)
    const limit = parseInt(req.query.limit)
    console.log("page " + page)
    console.log("limit " + limit)
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    const result = await influService.getAllInfluencer()
    if (!result) {
      return res.json({ message: 'Fails ' });
    }
    const JsonData = {}
    JsonData.data = result.slice(startIndex, endIndex)
    JsonData.TotalPage = result.length / 12 > parseInt(result.length / 12) ? parseInt(result.length / 12) + 1 : parseInt(result.length / 12)
    if (endIndex < result.length) {
      JsonData.next = {
        page: page + 1,
        limit: limit
      }
    }
    if (startIndex > 0) {
      JsonData.previous = {
        page: page - 1,
        limit: limit
      }
    }
    return res.json({ JsonData: JsonData })
  } catch (err) {
    console.log(err);
    return res.json({ message: "Lỗi ", err });
  }
}

async function searchInfluencer(req, res, next) {
  try {
    const { costEstimateFrom, costEstimateTo, ageFrom, ageTo, contentTopic, nameType, contentFormats, audienceGender, audienceLocation, followerFrom, followerTo, postsPerWeekFrom, postsPerWeekTo, engagementTo, engagementFrom, audienceAge } = req.body;

    const result = await influService.searchInfluencer(costEstimateFrom, costEstimateTo, ageFrom, ageTo, contentTopic, nameType, contentFormats, audienceGender, audienceLocation, followerFrom, followerTo, postsPerWeekFrom, postsPerWeekTo, engagementTo, engagementFrom, audienceAge);
    return res.status(200).json({
      message: "Search thành công",
      data: result
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Lỗi", err }); // Sending an error response with status 500
  }
}

async function searchPoint(req, res, next) {
  // Update lại điểm khi search thông tin Influencer
  try {
    const { clientId, pointSearch } = req.body
    const updatePointSearch = await influService.updatePointSearch(clientId, pointSearch);
    if (updatePointSearch.rowsAffected[0]) {
      return res.status(200).json({
        message: "Update Search Point thành công"
      });
    } else {
      return res.json({ message: "Update Thất bại" });
    }
  } catch (error) {
    return res.json({ message: error });
  }
}

async function getAllHistoryReportByClient(req, res, next) {
  try {
    const { clientId } = req.body;
    const getData = await influService.getAllHistoryReportByClientId(clientId);
    return res.json({
      message: "Search thành công",
      data: getData
    });
  } catch (error) {
    return res.json({ message: error });
  }
}

// Trừ điểm khi xem Thông tin của Influencer tại HomePage
async function reportOfInfluencer(req, res, next) {
  try {
    const { clientId, pointReport } = req.body;
    const updatePointReport = await influService.updatePointReport(clientId, pointReport);
    if (updatePointReport.rowsAffected[0]) {
      return res.status(200).json({
        message: "Update Report Point thành công"
      });
    } else {
      return res.json({ message: "Update Thất bại" });
    }
  } catch (error) {
    return res.json({ message: error });
  }
}

async function insertDataToHistoryReport(req, res, next) {
  try {
    const { influencerId, clientId } = req.body;
    const checkInfluencerExisted = await influService.checkInfluencerExistedInHistoryView(clientId,influencerId)
    const check = checkInfluencerExisted.recordset
    console.log(checkInfluencerExisted)
    if (!checkInfluencerExisted.recordset.length > 0) {
      const insertHistoryViewInfluencer = await influService.insertHistoryViewInfluencer(clientId, influencerId)
      if (insertHistoryViewInfluencer) {
        return res.status(200).json({
          status: "True",
          message: "Insert To History View Of List Influencer thành công",
        });
      }
      return res.status(200).json({
        status: "False",
        message: "Insert To History View Of List Influencer Thất bại",
      });
    }
    else {
      return res.json({ status: "False", message: "Id Đã tồn tại " });
    }
  } catch (error) {
    return res.json({ message: error });
  }
}

async function dataReportInfluencer(req, res, next) {
  try {
    const { userId, email, role } = req.body;
    const infoInfluencer = await influService.getAllInfluencerByEmail(email);
    const data = common.formatResponseInfluencerToArray(infoInfluencer);
    sql.connect(config, async (err) => {
      if (err) {
        console.log(err);
        return res.json({ message: " " + err });
      }

      const request = new sql.Request();

      const dataPromise = data.map(async (info) => {
        try {
          const result = await request.query(`
          SELECT Date_edit FROM [UpReachDB].[dbo].[KOLs] WHERE KOLs_ID = '${info.influencerId}'
        `);
          return { ...info, dateEdit: result.recordset[0].Date_edit };
        } catch (error) {
          console.error("Error querying database:", error);
          throw error;
        }
      });

      Promise.all(dataPromise).then((results) => {
        results.forEach((result) => {

        });
        return res.json({
          Influencer: results,
        });
      });
    });
  } catch (error) {
    return res.json({ message: "Lỗi " + error });
  }
}

async function updateInfluencer(req, res, next) {
  try {
    // return res.json({data : req.body.influencerDetail})
    const { email } = req.body.influencerDetail
    const idInflu = req.body.idInflu;
    const image = req.body.image[0]
    const uploadedImages = [];
    if (image.thumbUrl) {
      const img = await cloudinary.uploader.upload(image.thumbUrl, {
        public_id: image.uid,
        resource_type: "auto",
      });
      uploadedImages.push({ userId: image.userId, id: image.uid, url: img.url });
    } else uploadedImages.push({ userId: image.userId, id: image.uid, url: image.url });
    const updateAvatar = await influService.updateInfluencer(email, uploadedImages[0].url);
    if (updateAvatar.rowsAffected[0]) {
      return res.json({ message: "Update Avatar success" })
    }
    if(idInflu){
      await influModel.findByIdAndUpdate(idInflu, {
        avatarImage: uploadedImages[0].url,
        nickname: nickname
      })
    }
    // Nếu tất cả các thao tác trước đó thành công, gửi phản hồi thành công
  } catch (error) {
    console.log(error)
    return res.json({ status: "False", message: "Update Avatar Fail" })
  }
}


async function addInfluencer(req, res, next) {
  try {
    const image = req.body.image[0]
    const uploadedImages = [];
    if (image.thumbUrl) {
      const img = await cloudinary.uploader.upload(image.thumbUrl, {
        public_id: image.uid,
        resource_type: "auto",
      });
      uploadedImages.push({ userId: image.userId, id: image.uid, url: img.url });
    } else uploadedImages.push({ userId: image.userId, id: image.uid, url: image.url });
    const { nickname, location, gender, age, intro, typeId, relationship } = req.body.informationDetails
    const { emailContact, phone } = req.body.overviewDetails
    const { name, email } = req.body.influencerDetail
    const user = await userService.getUserByEmail(email);
    const now = new Date();
    const dateNow = now.toISOString();
    if (!await addInfluencerProfile(name, nickname, emailContact, age, phone, gender, intro, location, relationship, typeId,uploadedImages[0].url)) {
      return res.json({ status: 'False', message: 'Insert Data Influencer Profiles Fails' });
    }
    if (!await addDataToContentTopic(req.body.contentDetails)) {
      return res.json({ status: 'False', message: 'Insert Data ContentTopic Fails' });
    }
    if (!await addInfluencerKols(user.userId, 0, null)) {
      return res.json({ status: 'False', message: 'Insert Data Kols Fails' });
    }

    //Create influe in mongodb
    const influe =  await influModel.create({
      avatarImage: uploadedImages[0].url,
      nickname: nickname,
      email: email
    });
    
    const infoInfluencer = await userService.getUserInfluencerByEmail(email)
    console.log("infoInfluencer", infoInfluencer)
    // Nếu tất cả các thao tác trước đó thành công, gửi phản hồi thành công
    return res.json({
      status: 'True',
      message: 'Insert Success Influencer',
      data : infoInfluencer,
      _idMongodb: influe._id
    });

  } catch (err) {
    // Xử lý lỗi
    res.json({ status: 'False', message: 'Lỗi' });
  }
}

async function addInfluencerProfile(fullName, nickName, email, age, phone, gender, bio, address, relationship, typeId,avatar) {
  try {

    // Thực hiện insert
    const checkAddInfluencerProfile = await influService.insertInfluencerProfile(fullName, nickName, email, age, phone, gender, bio, address, relationship, typeId, avatar)
    if (checkAddInfluencerProfile.rowsAffected[0]) {
      return true;
    } else {
      return false;
    }

  } catch (e) {
    console.log(e)
    return false;
  }
}

async function addDataToContentTopic(dataArray) {
  try {
    const checkAddDataToContentTopic = await influService.insertDatatoContentTopic(dataArray)
    if (checkAddDataToContentTopic.rowsAffected[0]) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error)
    return false;
  }
}



async function addInfluencerKols(userId, isPublish, dateEdit) {
  try {

    // Thực hiện insert
    const checkAddInfluencerKols = await influService.insertKols(userId, isPublish, dateEdit)
    if (checkAddInfluencerKols.rowsAffected[0]) {
      return true;
    } else {
      return false;
    }

  } catch (e) {
    console.log(e)
    return false;
  }
}


async function createInflu(req, res, next) {
  try {
    const { nickname, email } = req.body;
    const usernameCheck = await influModel.findOne({ nickname })
    const emailCheck = await influModel.findOne({ email })
    if (usernameCheck) {
      return res.json({ msg: "Nick name already used", status: false });
    }
    if (emailCheck) {
      return res.json({ msg: "Email already used", status: false });
    }
    const influ = await influModel.create({
      email: email,
      nickname: nickname
    });
    return res.json({ status: true, data: influ })
  }
  catch (err) {
    return res.json({ message: ' ' + err });
  }
}

async function getDataForChart(req, res, next) {
  try {
    const { influencerId, influInfoEmail } = req.body
    const response = await influService.getChartDataInfluencer(influencerId)
    const result = common.formatChartDataInfluencer(response)
    const emailCheck = await influModel.findOne({ email: influInfoEmail })
    console.log("chart", result);
    console.log("emailCheck", emailCheck);
    if (!emailCheck) {
      return res.json({ message: "Influencer don't already", status: false });
    }
    if (!response) {
      return res.json({ message: 'Fails ' });
    }
    return res.status(200).json({
      message: "get data getDataForChart success",
      data: result,
      _idInflue: emailCheck._id,
    });
  } catch (error) {
    return res.json({ message: ' ' + error });
  }
}

async function getIdOfInflu(req, res, next) {
  try {
    const { email } = req.body
    const emailCheck = await influModel.findOne({ email })
    if (!emailCheck) {
      return res.json({ msg: "Influencer don't already", status: false });
    }
    return res.status(200).json({
      status: true,
      data: emailCheck,
    })
  } catch (error) {
    return res.json({ message: ' ' + error });
  }
}

async function getDataVersion(req, res, next) {
  try {
    const { influencerId } = req.body
    const response = await influService.getVersionDataInfluencer(influencerId)
    const result = common.formatChartDataInfluencer(response)
    if (!response) {
      return res.json({ message: 'Fails ' });
    }
    return res.status(200).json({
      message: "get data version success",
      data: result
    });
  } catch (error) {
    return res.json({ message: ' ' + error });
  }
}

async function getJobsInfluencer(req, res, next) {
  try {
    const user = await getUserByEmail(req.query.email);
    sql.connect(config, async (err) => {
      if (err) {
        console.log(err);
        return res.json({ message: " " + err });
      }
      const request = new sql.Request();
      const selectedKOLs = await request.query(
        `SELECT Top 1 * FROM [UpReachDB].[dbo].[KOLs] WHERE User_ID = '${user.userId}' ORDER BY Date_edit DESC`
      );
      request.query(
        `SELECT Job_ID FROM [UpReachDB].[dbo].[InfluencerJobList] WHERE Profile_ID = '${selectedKOLs.recordset[0].Profile_ID}' AND isPublish = 1`,
        async (error, queryResult) => {
          if (error) {
            console.log(error);
            return res.json({ message: " " + err });
          }
          const selectedJobs = [];
          const statusBookings = [];

          const jobIds = queryResult.recordset;

          for (const job_Id of jobIds) {
            const jobIdToFind = job_Id.Job_ID;

            const queryResultBooking = await request.query(
              `SELECT Status FROM [UpReachDB].[dbo].[ClientBooking] WHERE Job_ID = '${jobIdToFind}'`
            );
            statusBookings.push({ status: queryResultBooking?.recordset[0]?.Status });


            const queryResultJob = await request.query(
              `SELECT * FROM [UpReachDB].[dbo].[InfluencerJob] WHERE Job_ID = '${jobIdToFind}'`
            );
            selectedJobs.push(queryResultJob?.recordset[0]);
          }

          const selectedFormats = [];
          for (const job_Id of jobIds) {
            const jobIdToFind = job_Id?.Job_ID;
            const queryResultFormat = await request.query(
              `SELECT Format_Id FROM [UpReachDB].[dbo].[JobContentFormatList] WHERE Job_ID = '${jobIdToFind}' `
            );

            selectedFormats.push({
              Format_Id: queryResultFormat?.recordset[0]?.Format_Id,
            });
          }
          const selectedJobsListId = [];
          for (const job_Id of jobIds) {
            const jobIdToFind = job_Id.Job_ID;
            const queryResultJobListId = await request.query(
              `SELECT JobList_ID FROM [UpReachDB].[dbo].[InfluencerJobList] WHERE Job_ID = '${jobIdToFind}'`
            );

            selectedJobsListId.push({
              JobList_ID: queryResultJobListId?.recordset[0]?.JobList_ID,
            });
          }

          const result = {};
          selectedJobs.forEach((job, index) => {
            result[job?.Job_ID] = {
              ...job,
              Format_Id: selectedFormats[index]?.Format_Id || "",
              JobList_ID: selectedJobsListId[index]?.JobList_ID || "",
              status: statusBookings[index]?.status || "",
            };
          });

          const mergedArray = Object.values(result);
          return res.status(200).json({
            message: "Get Successfully",
            data: mergedArray,
          });
        }
      );
    });
  } catch (err) {
    console.log(err);
    return res.json({ message: " " + err });
  }
}

async function getImagesInfluencer(req, res, next) {
  try {
    const user = await getUserByEmail(req.query.email);

    sql.connect(config, async (err) => {
      if (err) {
        console.log(err);
        return res.json({ message: " " + err });
      }

      const request = new sql.Request();
      const selectedKOLs = await request.query(
        `SELECT Top 1 * FROM [UpReachDB].[dbo].[KOLs] WHERE User_ID = '${user.userId}' ORDER BY Date_edit DESC`
      );
      request.query(
        `SELECT Image_ID FROM [UpReachDB].[dbo].[ImageKOLs] WHERE Profile_ID = '${selectedKOLs.recordset[0].Profile_ID}'`,
        async (error, queryResult) => {
          if (error) {
            console.log(error);
            return res.json({ message: " " + err });
          }
          const selectedImages = [];
          const imageIds = queryResult.recordset;

          for (const ImageId of imageIds) {
            const ImageIdToFind = ImageId.Image_ID;
            const queryResultImage = await request.query(
              `SELECT * FROM [UpReachDB].[dbo].[ImageKOLs] WHERE Image_ID = '${ImageIdToFind}'`
            );
            selectedImages.push(queryResultImage.recordset[0]);
          }
          return res.status(200).json({
            message: "Get Successfully",
            data: selectedImages,
          });
        }
      );
    });
  } catch (err) {
    console.log(err);
    return res.json({ message: " " + err });
  }
}

async function getAudienceInfluencer(req, res, next) {
  try {
    const user = await getUserByEmail(req.query.email);
    sql.connect(config, async (err) => {
      if (err) {
        console.log(err);
        return res.json({ message: " " + err });
      }

      const request = new sql.Request();
      const selectedKOLs = await request.query(
        `SELECT * FROM [UpReachDB].[dbo].[KOLs] WHERE User_ID = '${user.userId}' AND isPublish = 1`
      );

      const selectedIds = selectedKOLs.recordset[0];

      const selectedFollowers = await getSelectedFollowers(
        request,
        selectedIds
      );
      const selectedGenders = await getSelectedGenders(request, selectedIds);
      const selectedAges = await getSelectedAges(request, selectedIds);
      const selectedLocations = await getSelectedLocations(
        request,
        selectedIds
      );

      const responseData = {
        selectedFollowers: selectedFollowers,
        selectedGenders: selectedGenders,
        selectedAges: selectedAges,
        selectedLocations: selectedLocations,
      };

      return res.status(200).json({
        message: "Get Successfully",
        data: responseData,
      });
    });
  } catch (err) {
    console.log(err);
    return res.json({ message: " " + err });
  }
}

async function getSelectedFollowers(request, selectedIds) {
  return new Promise((resolve, reject) => {
    request.query(
      `SELECT AudienceFollowerMonth FROM [UpReachDB].[dbo].[AudienceFollowerMonthList] WHERE Platform_ID = '${selectedIds.Platform_ID}'`,
      async (error, queryResult) => {
        if (error) {
          console.log(error);
          return reject(error);
        }
        const selectedFollowers = [];
        const followers = queryResult.recordset;

        for (const follower of followers) {
          const followerToFind = follower.AudienceFollowerMonth;
          const queryResultfollower = await request.query(
            `SELECT * FROM [UpReachDB].[dbo].[AudienceFollowerMonthList] WHERE AudienceFollowerMonth = '${followerToFind}'`
          );
          selectedFollowers.push(queryResultfollower.recordset[0]);
        }
        resolve(selectedFollowers);
      }
    );
  });
}

async function getSelectedGenders(request, selectedIds) {
  return new Promise((resolve, reject) => {
    request.query(
      `SELECT AudienceGenderList.AudienceGenderList_ID, AudienceGenderList.AudienceGenderId, AudienceGender.Gender, AudienceGenderList.Platform_ID, AudienceGenderList.Quantity 
      FROM [UpReachDB].[dbo].[AudienceGenderList]
      INNER JOIN [UpReachDB].[dbo].[AudienceGender] ON AudienceGenderList.AudienceGenderId = AudienceGender.AudienceGenderId
      WHERE AudienceGenderList.Platform_ID = '${selectedIds.Platform_ID}'`,
      async (error, queryResult) => {
        if (error) {
          console.log(error);
          return reject(error);
        }
        const selectedGenders = queryResult.recordset;
        resolve(selectedGenders);
      }
    );
  });
}

async function getSelectedAges(request, selectedIds) {
  return new Promise((resolve, reject) => {
    request.query(
      `SELECT AudienceAgeRangeList.AudienceAgeList_ID, AudienceAgeRangeList.AudienceAge_ID, AudienceAgeRange.AgeRange, AudienceAgeRangeList.Platform_ID, AudienceAgeRangeList.Quantity 
      FROM [UpReachDB].[dbo].[AudienceAgeRangeList]
      INNER JOIN [UpReachDB].[dbo].[AudienceAgeRange] ON AudienceAgeRangeList.AudienceAge_ID = AudienceAgeRange.AudienceAge_ID
      WHERE AudienceAgeRangeList.Platform_ID = '${selectedIds.Platform_ID}'`,
      async (error, queryResult) => {
        if (error) {
          console.log(error);
          return reject(error);
        }
        const selectedAges = queryResult.recordset;
        resolve(selectedAges);
      }
    );
  });
}

async function getSelectedLocations(request, selectedIds) {
  return new Promise((resolve, reject) => {
    request.query(
      `SELECT AudienceLocation FROM [UpReachDB].[dbo].[AudienceLocationList] WHERE Platform_ID = '${selectedIds.Platform_ID}'`,
      async (error, queryResult) => {
        if (error) {
          console.log(error);
          return reject(error);
        }
        const selectedLocations = [];
        const locations = queryResult.recordset;

        for (const location of locations) {
          const locationToFind = location.AudienceLocation;
          const queryResultLocation = await request.query(
            `SELECT * FROM [UpReachDB].[dbo].[AudienceLocationList] WHERE AudienceLocation = N'${locationToFind}'`
          );
          selectedLocations.push(queryResultLocation.recordset[0]);
        }
        resolve(selectedLocations);
      }
    );
  });
}

async function getBookingJob(req, res, next) {
  try {
    const user = await getUserByEmail(req.query.email);
    sql.connect(config, async (err) => {
      if (err) {
        console.log(err);
        return res.json({ message: " " + err });
      }
      try {
        const request = new sql.Request();

        const selectedKOLs = await request.query(
          `SELECT * FROM [UpReachDB].[dbo].[KOLs] WHERE isPublish = 1 AND User_ID = '${user.userId}'`
        );

        if (selectedKOLs.recordset.length > 0) {
          const jobIdsQueryResult = await request.query(
            `SELECT Job_ID FROM [UpReachDB].[dbo].[InfluencerJobList] WHERE Profile_ID = '${selectedKOLs.recordset[0].Profile_ID}'`
          );

          const jobIds = jobIdsQueryResult.recordset;

          if (jobIds.length > 0) {
            const bookingJobs = [];
            for (const job_Id of jobIds) {
              const jobIdToFind = job_Id.Job_ID;
              const queryResultJob = await request.query(
                `SELECT * FROM [UpReachDB].[dbo].[ClientBooking] WHERE Job_ID = '${jobIdToFind}'`
              );
              const queryResultClient = await request.query(
                `SELECT * FROM [UpReachDB].[dbo].[Clients] WHERE Client_ID = '${queryResultJob?.recordset[0]?.Client_ID}'`
              );
              const bookingJob = queryResultJob?.recordset[0];
              const clientInfo = queryResultClient?.recordset[0];

              if (bookingJob && clientInfo) {
                bookingJob.clientInfo = clientInfo;
                bookingJobs.push(bookingJob);
              }
            }
            if (bookingJobs.length > 0) {
              const selectedJobs = [];
              for (const bookingJob of bookingJobs) {
                const jobId = bookingJob?.Job_ID;
                const queryResultJob = await request.query(
                  `SELECT * FROM [UpReachDB].[dbo].[InfluencerJob] WHERE Job_ID = '${jobId}'`
                );
                selectedJobs.push(queryResultJob?.recordset[0]);
              }

              const jobsIdBooking = selectedJobs?.map(job => job?.Job_ID);

              const selectedFormats = [];
              for (const jobIdBooking of jobsIdBooking) {
                const queryResultFormat = await request.query(
                  `SELECT Format_Id FROM [UpReachDB].[dbo].[JobContentFormatList] WHERE Job_ID = '${jobIdBooking}'`
                );
                const formatIds = queryResultFormat?.recordset?.map(format => format?.Format_Id);
                selectedFormats.push({
                  Format_Id: formatIds,
                  Job_ID: jobIdBooking,
                });
              }

              const result = {};
              selectedJobs.forEach((job) => {
                result[job?.Job_ID] = {
                  ...job,
                  Format_Id:
                    selectedFormats.find((format) => format?.Job_ID === job?.Job_ID)?.Format_Id || [],
                };
              });

              const mergedArray = Object.values(result);
              for (const mergedItem of mergedArray) {
                const matchingBookingJob = bookingJobs?.find(bookingJob => bookingJob?.Job_ID === mergedItem?.Job_ID);
                if (matchingBookingJob) {
                  Object.assign(mergedItem, matchingBookingJob);
                }
              }

              return res.status(200).json({
                message: "Get Successfully",
                data: mergedArray,
              });
            }
          }
        }
      } catch (error) {
        console.log(error);
        return res.json({ message: " " + error });
      }
    });
  } catch (err) {
    console.log(err);
    return res.json({ message: " " + err });
  }
}

async function acceptBooking(req, res, next) {
  try {
    const bookingDetail = JSON.parse(req.body.booking);

    sql.connect(config, async (err) => {
      if (err) {
        console.log(err);
        return res.json({ message: " " + err });
      }
      const request = new sql.Request();
      await request.input('status', sql.NVarChar, bookingDetail.status)
      await request.input('bookingId', sql.NVarChar, bookingDetail.bookingId)
        .query(`
          BEGIN
          UPDATE [UpReachDB].[dbo].[ClientBooking]
          SET         
             Status = @status
          WHERE clientBooking_ID = @bookingId
          END
      `);

      return res.status(201).json({
        message: "Accept booking successfully!",
        // data: ,
      });
    }
    );
  } catch (err) {
    console.log(err);
    return res.json({ message: " " + err });
  }
}

async function rejectBooking(req, res, next) {
  try {
    const bookingDetail = JSON.parse(req.body.booking);

    sql.connect(config, async (err) => {
      if (err) {
        console.log(err);
        return res.json({ message: " " + err });
      }
      const request = new sql.Request();
      await request.input('status', sql.NVarChar, bookingDetail.status)
      await request.input('bookingId', sql.NVarChar, bookingDetail.bookingId)
        .query(`
          BEGIN
          UPDATE [UpReachDB].[dbo].[ClientBooking]
          SET         
             Status = @status
          WHERE clientBooking_ID = @bookingId
          END
      `);

      return res.status(201).json({
        message: "Reject booking successfully!",
        // data: ,
      });
    }
    );
  } catch (err) {
    console.log(err);
    return res.json({ message: " " + err });
  }
}

//get the client with that influe
async function getClientsByInflue(req, res, next) {
  try {
    const { _idInflue } = req.body; // Assuming you're passing the influencer's ID as a parameter

    // Find the influencer by ID
    const influencer = await influModel.findById(_idInflue);

    if (!influencer) {
      return res.json({ msg: "Influencer not found.", status: false, });
    }

    // Find clients that have booked the specified influencer
    const clientsWithInflue = await clientModel.find({ booking: _idInflue })
      .select('_id username email avatarImage');

    res.json({
      data: clientsWithInflue,
      status: true
    });
  } catch (err) {
    console.log(err);
    return res.json({ message: " " + err });
  }
}

async function getDataForInfluencerByEmailAndPublish(req, res, next){
  try {
    const {email} = req.body
    const response = await influService.getAllInfluencerByEmailAndPublish(email);
    if(!isObjectEmpty(response)){
      return res.json({ status : "True", data : response})
    }
    return res.json({ status : "False", message : "Influncer Not Approved Yet "})
  } catch (err) {
    console.log(err);
    return res.json({ message: " " + err });
  }
}



// module.exports = router;
module.exports = {getDataForInfluencerByEmailAndPublish, getAllHistoryReportByClient, reportOfInfluencer, insertDataToHistoryReport, searchPoint, getDataForChart, updateInfo, searchInfluencer, getAllInfluencer, dataReportInfluencer, addInfluencer, createInflu, getIdOfInflu, updateInfluencer, getDataVersion, getJobsInfluencer, getImagesInfluencer, getAudienceInfluencer, getBookingJob, acceptBooking, rejectBooking, getClientsByInflue }
