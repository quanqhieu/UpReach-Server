const express = require("express");
const passport = require("passport");
const config = require("../../Config/dbConfig");
const sql = require("mssql");
const influService = require("../../Service/Influencer/InfluencerService")
const userService = require('../../Service/User/UserService')
const common = require('../../../../common/common')
const { getAllInfluencer } = require("../../Service/Influencer/InfluencerService");

const { getAllClient } = require("../../Service/Client/clientService");

const router = express.Router();

// auth.initialize(
//     passport,
//     (id) => userModels.find((user) => user.userId === id),
//     (email) => userModels.find((user) => user.userEmail === email)
//   );

//----------------------------------Report Waiting Approve-------------------------


  async function getApproveReport(req, res, next) {
    try {
      const users = await getAllInfluencer();
      const userIds = users.map((item)=>item?.userId)
      const uniqueIds = [...new Set(userIds)];
      sql.connect(config, async (err) => {
        if (err) {
          console.log(err);
          return res.json({ message: " " + err });
        }
        
        const request = new sql.Request();
        const approveInfos = []
        for (let userId of uniqueIds) {

          const influInfoApprove = await  request.query(`
          SELECT Top 1 * FROM [UpReachDB].[dbo].[KOLs] WHERE User_ID = '${userId}' AND isPublish = 0 ORDER BY Date_edit DESC
          `)
          if(influInfoApprove?.recordset?.length > 0 )
          approveInfos.push(influInfoApprove?.recordset[0])
      }
      
      const reportApproves = []
      for(let approveInfo of approveInfos ) {
        const influUserApprove = await  request.query(`
        SELECT * FROM [UpReachDB].[dbo].[KOLs] WHERE Platform_ID = '${approveInfo?.Platform_ID}' 
        `)  
        const influPlatformApprove = await  request.query(`
          SELECT * FROM [UpReachDB].[dbo].[PlatformInformation] WHERE Platform_ID = '${approveInfo?.Platform_ID}' 
          `)

          const influProfileApprove = await  request.query(`
          SELECT * FROM [UpReachDB].[dbo].[Profile] WHERE Profile_ID = '${approveInfo?.Profile_ID}' 
          `)

          const influImageApprove = await  request.query(`
          SELECT * FROM [UpReachDB].[dbo].[ImageKOLs] WHERE Profile_ID = '${approveInfo?.Profile_ID}' 
          `)
          const influAudienceFollowerApprove = await  request.query(`
          SELECT * FROM [UpReachDB].[dbo].[AudienceFollowerMonthList] WHERE Platform_ID = '${approveInfo?.Platform_ID}' 
          `)

          const influAudienceLocationApprove = await  request.query(`
          SELECT * FROM [UpReachDB].[dbo].[AudienceLocationList] WHERE Platform_ID = '${approveInfo?.Platform_ID}' 
          `)

          const influAudienceGenderApprove = await  request.query(`
          SELECT AudienceGenderList.AudienceGenderList_ID, AudienceGenderList.AudienceGenderId, AudienceGender.Gender, AudienceGenderList.Platform_ID, AudienceGenderList.Quantity 
      FROM [UpReachDB].[dbo].[AudienceGenderList]
      INNER JOIN [UpReachDB].[dbo].[AudienceGender] ON AudienceGenderList.AudienceGenderId = AudienceGender.AudienceGenderId
      WHERE AudienceGenderList.Platform_ID = '${approveInfo?.Platform_ID}'
          `)

          const influAudienceAgeApprove = await  request.query(`
          SELECT AudienceAgeRangeList.AudienceAgeList_ID, AudienceAgeRangeList.AudienceAge_ID, AudienceAgeRange.AgeRange, AudienceAgeRangeList.Platform_ID, AudienceAgeRangeList.Quantity 
      FROM [UpReachDB].[dbo].[AudienceAgeRangeList]
      INNER JOIN [UpReachDB].[dbo].[AudienceAgeRange] ON AudienceAgeRangeList.AudienceAge_ID = AudienceAgeRange.AudienceAge_ID
      WHERE AudienceAgeRangeList.Platform_ID = '${approveInfo?.Platform_ID}'
          `)



        const jobIds = await request.query(
            `SELECT Job_ID FROM [UpReachDB].[dbo].[InfluencerJobList] WHERE Profile_ID = '${approveInfo?.Profile_ID}'`,
            );


            const selectedJobs = [];

              for (const job_ID of jobIds?.recordset) {
                const jobIdToFind = job_ID?.Job_ID;
                const queryResultJob = await request.query(
                  `SELECT * FROM [UpReachDB].[dbo].[InfluencerJob] WHERE Job_ID = '${jobIdToFind}'`
                );
                selectedJobs.push(queryResultJob?.recordset[0]);
              }

              const selectedFormats = [];
          for (const job_ID of jobIds?.recordset) {
            const jobIdToFind = job_ID?.Job_ID;
            const queryResultFormat = await request.query(
              `SELECT Format_Id FROM [UpReachDB].[dbo].[JobContentFormatList] WHERE Job_ID = '${jobIdToFind}' `
            );

            selectedFormats?.push({
              Format_Id: queryResultFormat?.recordset[0]?.Format_Id,
            });
          }
              const result = {};

              selectedJobs.forEach((job, index) => {
                result[job?.Job_ID] = {
                  ...job,
                  Format_Id:selectedFormats[index]?.Format_Id || "",
                };
              });


              
              const influJobsApprove = Object.values(result);
            const reportApprove = { 
              user: influUserApprove?.recordset[0],
              profile:  influProfileApprove?.recordset[0],
              platform: influPlatformApprove?.recordset[0],
              image: influImageApprove?.recordset,
              audienceFollower: influAudienceFollowerApprove?.recordset,
              audienceAge:influAudienceAgeApprove?.recordset,
              audienceGender:influAudienceGenderApprove?.recordset,
              audienceLocation: influAudienceLocationApprove?.recordset,
              jobs: influJobsApprove
            }  
            reportApproves.push(reportApprove)
          }
          return res.status(200).json({
            message: "Get approve report successfully!",
            data: reportApproves
          });
          
      });
    } catch (err) {
      console.log(err);
      return res.json({ message: " " + err });
    }
  }

//   async function dataReportAdmin(req,res,next){
//     try {
//         const {userId, email, role} = req.body
//         if(role === '2'){
//             const infoClient = await clientService.getClientByEmail(email);
//             const infoInfluencer = await influService.getAllInfluencerByPublish();
//             return res.json({ Client : infoClient, Influencer1 : infoInfluencer})
//         }
//         return res.json({ message : "Bạn không có quyền truy cập vào"})
//     } catch (error) {
//         return res.json({message : ' ' + error});
//     }
// }

  async function postApproveReport(req, res, next) {
    try {
      const {userId,kolsId,profilesId, platformsId } = req.body;
      sql.connect(config, async (err) => {
        if (err) {
          console.log(err);
          return res.json({ message: " " + err });
        }

        const request = new sql.Request();
       const checkInflu =  await  request.query(`
       BEGIN
       SELECT * FROM [UpReachDB].[dbo].[KOLs] 
       WHERE User_ID = '${userId}'
       END
       `)

      //  console.log(userId, checkInflu.recordset);
       if(checkInflu.recordset.some((item)=>item.isPublish)){

         const selectedUserID = await  request.query(`
         BEGIN
         SELECT * FROM [UpReachDB].[dbo].[KOLs] 
         WHERE User_ID = '${userId}' AND isPublish = 1
         END
         `)
 
         const userIdObject = selectedUserID?.recordset[0];
         const userObject = {...userIdObject}
         const kolId = userObject?.KOLs_ID;
         const profileId = userObject?.Profile_ID;
         const platformId = userObject?.Platform_ID;
 
         
         await request.query(`
         BEGIN
         UPDATE [UpReachDB].[dbo].[HistoryViewInfluencerReport] 
         SET KOLs_ID = '${kolsId}'
         WHERE KOLs_ID = '${kolId}'
         END
 
         BEGIN
         UPDATE [UpReachDB].[dbo].[InfluencerContentFormatsList] 
         SET Profile_ID = '${profilesId}'
         WHERE Profile_ID = '${profileId}'
         END

         BEGIN
         UPDATE [UpReachDB].[dbo].[InfluencerContentTopicsLists] 
         SET Profile_ID = '${profilesId}'
         WHERE Profile_ID = '${profileId}'
         END
 
         BEGIN
         UPDATE [UpReachDB].[dbo].[InfluencerTypeList] 
         SET Profile_ID = '${profilesId}'
         WHERE Profile_ID = '${profileId}'
         END
 
         BEGIN
         UPDATE [UpReachDB].[dbo].[ListKOLs] 
         SET KOLs_ID = '${kolsId}'
         WHERE KOLs_ID = '${kolId}'
         END
 
         BEGIN
         UPDATE [UpReachDB].[dbo].[KOLs]
         SET isPublish = 0
         WHERE User_ID = '${userId}'
         END
 
         BEGIN
         UPDATE [UpReachDB].[dbo].[KOLs]
         SET isPublish = 1
         WHERE KOLs_ID = '${kolsId}'
         END 
 `)
 
         const selectedJobID = await  request.query(`
         BEGIN
         SELECT JOB_ID FROM [UpReachDB].[dbo].[InfluencerJobList] 
         WHERE Profile_ID = '${profileId}'
         END
         `)
 
         const jobIdObjects = selectedJobID?.recordset;
         for (let jobIdObject of jobIdObjects) {
           const jobId = jobIdObject?.JOB_ID;
       
           const checkQuery = `SELECT * FROM [UpReachDB].[dbo].[ClientBooking] WHERE JOB_ID = '${jobId}'`;
           const checkResult = await request.query(checkQuery);
       
           if (checkResult?.recordset?.length === 0) {
               const deleteQuery = `
                   BEGIN
                       DELETE FROM [UpReachDB].[dbo].[JobContentFormatList] 
                       WHERE JOB_ID = '${jobId}'
                   END
                   BEGIN
                       DELETE FROM [UpReachDB].[dbo].[InfluencerJobList] 
                       WHERE JOB_ID = '${jobId}'
                   END
                   BEGIN
                       DELETE FROM [UpReachDB].[dbo].[InfluencerJob] 
                       WHERE JOB_ID = '${jobId}'
                   END
               `;
               const deleteJobID = await request.query(deleteQuery);
               
           } else {
             const updateQuery = `
                   BEGIN
                       UPDATE [UpReachDB].[dbo].[InfluencerJobList]
                       SET Profile_ID = '${profilesId}',
                           isPublish = 0
                       WHERE Profile_ID = '${profileId}'
                   END
               `;
               const deleteJobID = await request.query(updateQuery);
           }
       }
       
 
         const adminApprove = await  request.query(`
         
         BEGIN
         DELETE FROM [UpReachDB].[dbo].[AudienceAgeRangeList] WHERE Platform_ID = '${platformId}';
         DELETE FROM [UpReachDB].[dbo].[AudienceFollowerMonthList] WHERE Platform_ID = '${platformId}';
         DELETE FROM [UpReachDB].[dbo].[AudienceGenderList] WHERE Platform_ID = '${platformId}';
         DELETE FROM [UpReachDB].[dbo].[AudienceLocationList] WHERE Platform_ID = '${platformId}';
         END
 
         BEGIN
         DELETE FROM [UpReachDB].[dbo].[ImageKOLs] WHERE Profile_ID = '${profileId}';
         END
 
         BEGIN
         DELETE FROM [UpReachDB].[dbo].[InfluencerTypeList] WHERE Profile_ID = '${profileId}';
         END
 
         BEGIN
         DELETE FROM [UpReachDB].[dbo].[InfluencerContentTopicsLists] WHERE Profile_ID = '${profileId}';
         END
 
         BEGIN
         DELETE FROM [UpReachDB].[dbo].[KOLs] WHERE User_ID = '${userId}' AND isPublish = 0;
         END
         
         `)
         await request.query(`
         BEGIN
         DELETE FROM [UpReachDB].[dbo].[PlatformInformation] WHERE Platform_ID = '${platformId}';
         END
 
         BEGIN
         DELETE FROM [UpReachDB].[dbo].[Profile] WHERE Profile_ID = '${profileId}';
         END`)
        } else {
          // console.log(23123,kolsId);
          await request.query(`
          BEGIN
          UPDATE [UpReachDB].[dbo].[KOLs]
          SET isPublish = 1
          WHERE KOLs_ID = '${kolsId}'
          END 
          `)
        }
        return res.status(200).json({
          message: "Approve successful!",
          // data: 
        });
          
      });
    } catch (err) {
      console.log(err);
      return res.json({ message: " " + err });
    }
  }

  async function getInfluencerAccount(req, res, next) {
    try {
      const profileInfluencers = await influService.getProfileInfluencerByPublish();
          return res.status(200).json({
            message: "Get influencer information successfully!",
            data: profileInfluencers
          });
          
   
    } catch (err) {
      console.log(err);
      return res.json({ message: " " + err });
    }
  }

  async function getTopInfluencer(req, res, next) {
    try {
      const topInfluencers = await influService.getTopInfluencer();
          return res.status(200).json({
            message: "Get influencer information successfully!",
            data: topInfluencers
          });
          
   
    } catch (err) {
      console.log(err);
      return res.json({ message: " " + err });
    }
  }

  async function editInflu(req, res, next) {
    try {
      const influ = JSON.parse(req.body?.influ);
      const influId = JSON.parse(req.body?.influId);

      sql.connect(config, async (err) => {
        if (err) {
          console.log(err);
          return res.json({ message: " " + err });
        }
        const request = new sql.Request();
        await request.input('fullName', sql.NVarChar, influ?.influencerfullName)
        .input('age', sql.Int, influ?.influencerAge)
        .input('gender', sql.NVarChar, influ?.influencerGender)
        .input('relationship', sql.NVarChar, influ?.influencerRelationship)
        .input('email', sql.NVarChar, influ?.influencerEmail)
        .input('phone', sql.NVarChar, influ?.influencerPhone)
        .input('address', sql.NVarChar, influ?.influencerAddress)
        .input('profileId', sql.NVarChar, influId)
        .query(`
            BEGIN
            UPDATE [UpReachDB].[dbo].[Profile]
            SET       
               fullName = @fullName,
               Age = @age,
               Gender = @gender,
               Relationship = @relationship,
               Email = @email,
               Phone = @phone,
               Address = @address
            WHERE Profile_ID = @profileId
            END
        `);
  
            return res.status(201).json({
              message: "Successfully!",
              // data: ,
            });
          }
        );
    } catch (err) {
      console.log(err);
      return res.json({ message: " " + err });
    }
  }

  async function lockInflu(req, res, next) {
    try {
      const profileId = JSON.parse(req.body?.profileId);
      
      
      sql.connect(config, async (err) => {
        if (err) {
          console.log(err);
          return res.json({ message: " " + err });
        }
        const request = new sql.Request();
        await request.input('profileId', sql.NVarChar, profileId)
        .query(`
            BEGIN
            UPDATE [UpReachDB].[dbo].[Profile]
            SET       
               isAccepted = 0
            WHERE Profile_ID = @profileId
            END
        `);
  
            return res.status(201).json({
              message: "Lock Influencer Successfully!",
              // data: ,
            });
          }
        );
    } catch (err) {
      console.log(err);
      return res.json({ message: " " + err });
    }
  }

  async function unlockInflu(req, res, next) {
    try {
      const profileId = JSON.parse(req.body?.profileId);
      
      
      sql.connect(config, async (err) => {
        if (err) {
          console.log(err);
          return res.json({ message: " " + err });
        }
        const request = new sql.Request();
        await request.input('profileId', sql.NVarChar, profileId)
        .query(`
            BEGIN
            UPDATE [UpReachDB].[dbo].[Profile]
            SET       
               isAccepted = 1
            WHERE Profile_ID = @profileId
            END
        `);
  
            return res.status(201).json({
              message: "Unlock Influencer Successfully!",
              // data: ,
            });
          }
        );
    } catch (err) {
      console.log(err);
      return res.json({ message: " " + err });
    }
  }

  async function getClientAccount(req, res, next) {
    try {
      const clients = await getAllClient();
     
          return res.status(200).json({
            message: "Get all client successfully!",
            data: clients
          });
          
    } catch (err) {
      console.log(err);
      return res.json({ message: " " + err });
    }
  }

  async function editClient(req, res, next) {
    try {
      const client = JSON.parse(req.body?.client);
      const clientId = JSON.parse(req.body?.clientId);

      sql.connect(config, async (err) => {
        if (err) {
          console.log(err);
          return res.json({ message: " " + err });
        }
        const request = new sql.Request();
        await request.input('fullName', sql.NVarChar, client?.fullName)
        .input('brand', sql.NVarChar, client?.brand)
        .input('email', sql.NVarChar, client?.email)
        .input('phone', sql.NVarChar, client?.phone)
        .input('address', sql.NVarChar, client?.address)
        .input('clientId', sql.NVarChar, clientId)
        .query(`
            BEGIN
            UPDATE [UpReachDB].[dbo].[Clients]
            SET       
               FullName = @fullName,
               Brand_Client = @brand,
               Email_Client = @email,
               Phone_Client = @phone,
               Address = @address
            WHERE Client_ID = @clientId
            END
        `);
  
            return res.status(201).json({
              message: "Successfully!",
              // data: ,
            });
          }
        );
    } catch (err) {
      console.log(err);
      return res.json({ message: " " + err });
    }
  }

  async function lockClient(req, res, next) {
    try {
      const clientId = JSON.parse(req.body?.clientId);
      
      
      sql.connect(config, async (err) => {
        if (err) {
          console.log(err);
          return res.json({ message: " " + err });
        }
        const request = new sql.Request();
        await request.input('clientId', sql.NVarChar, clientId)
        .query(`
            BEGIN
            UPDATE [UpReachDB].[dbo].[Clients]
            SET       
               isAccept = 0
            WHERE Client_ID = @clientId
            END
        `);
  
            return res.status(201).json({
              message: "Lock Client Successfully!",
              // data: ,
            });
          }
        );
    } catch (err) {
      console.log(err);
      return res.json({ message: " " + err });
    }
  }

  async function unlockClient(req, res, next) {
    try {
      const clientId = JSON.parse(req.body?.clientId);
      
      sql.connect(config, async (err) => {
        if (err) {
          console.log(err);
          return res.json({ message: " " + err });
        }
        const request = new sql.Request();
        await request.input('clientId', sql.NVarChar, clientId)
        .query(`
            BEGIN
            UPDATE [UpReachDB].[dbo].[Clients]
            SET       
               isAccept = 1
            WHERE Client_ID = @clientId
            END
        `);
  
            return res.status(201).json({
              message: "Unlock Client Successfully!",
              // data: ,
            });
          }
        );
    } catch (err) {
      console.log(err);
      return res.json({ message: " " + err });
    }
  }

  async function getTotalBooking(req, res, next) {
    try {
      sql.connect(config, async (err) => {
        if (err) {
          console.log(err);
          return res.json({ message: " " + err });
        }
        const request = new sql.Request();
        const bookings = await request.query(`
            BEGIN
            SELECT * FROM [UpReachDB].[dbo].[ClientBooking]
            END
        `);
        // console.log(bookings.recordset,"run");
            return res.status(201).json({
              message: "Get total booking Successfully!",
              data: bookings.recordset
            });
          }
        );
    } catch (err) {
      console.log(err);
      return res.json({ message: " " + err });
    }
  }

  async function getTotalList(req, res, next) {
    try {
      sql.connect(config, async (err) => {
        if (err) {
          console.log(err);
          return res.json({ message: " " + err });
        }
        const request = new sql.Request();
        const lists = await request.query(`
            BEGIN
            SELECT * FROM [UpReachDB].[dbo].[ClientListsKols]
            END
        `);
        // console.log(lists.recordset,"run");
            return res.status(201).json({
              message: "Get total list Successfully!",
              data: lists.recordset
            });
          }
        );
    } catch (err) {
      console.log(err);
      return res.json({ message: " " + err });
    }
  }

  async function editPackage(req, res, next) {
    try {
      const package = JSON.parse(req.body?.package);
      const clientId = JSON.parse(req.body?.clientId);
      console.log(package,1);
      console.log(clientId,2);
      sql.connect(config, async (err) => {
        if (err) {
          console.log(err);
          return res.json({ message: " " + err });
        }
        const request = new sql.Request();
        await request.input('clientId', sql.NVarChar, clientId)
        const remainingId = await request.query(`
            BEGIN
            SELECT Remaining_ID FROM [UpReachDB].[dbo].[Clients] WHERE Client_ID = @clientId
            END
        `);
        const pointReportInt = parseInt(package.pointReport, 10);
        const pointSearchInt = parseInt(package.pointSearch, 10);
        
        request.input('plan', sql.NVarChar, package.plan)
        const planId = await request.query(`
        BEGIN
        SELECT Plan_ID  FROM [UpReachDB].[dbo].[PlanPackage] WHERE [Plan] = @plan
        END
        `);
        request.input('pointReport', sql.Int, pointReportInt)
        request.input('pointSearch', sql.Int, pointSearchInt)
        request.input('remainingId', sql.NVarChar, remainingId.recordset[0].Remaining_ID)
    request.input('planId', sql.NVarChar, planId.recordset[0].Plan_ID)
  
        await request.query(`
        BEGIN
        UPDATE [UpReachDB].[dbo].[PointRemained]
                SET Plan_ID = @planId,
                    Usage_Reports = @pointReport,
                    Usage_Result_Searching = @pointSearch
                WHERE Remaining_ID = @remainingId
        END
    `);
        

            return res.status(201).json({
              message: "Successfully!",
              // data: ,
            });
          }
        );
    } catch (err) {
      console.log(err);
      return res.json({ message: " " + err });
    }
  }
  


  module.exports = {editPackage,getTotalList, getTotalBooking, getApproveReport, postApproveReport, getInfluencerAccount,getTopInfluencer,editInflu,lockInflu, unlockInflu, getClientAccount, editClient, lockClient, unlockClient }