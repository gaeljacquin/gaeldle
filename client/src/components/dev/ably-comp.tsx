// 'use client'

// import { useEffect, useState } from 'react';
// import Ably from 'ably';
// import { Button } from '../ui/button';


// // async function obtainTokenRequest() {
// //   const res = await fetch('http://localhost:8080/ably/token');

// //   return res.json();
// // }

// const hostname = process.env.VERCEL_URL ?? `http://localhost:${process.env.port}`;
// const ably = new Ably.Realtime({ authUrl: `${hostname}/api/ably`, authMethod: 'GET' });
// // const ably = new Ably.Realtime({ authUrl: `http://localhost:8080/ably/token`, authMethod: 'GET' });





// const channel = ably.channels.get('unlimitedStats');
// // const channel = ably.channels.get('unlimitedStats');
// // const channels = {
// //   dailyStats: ably.channels.get('dailyStats'),
// //   unlimitedStats: ably.channels.get('unlimitedStats')
// // };

// const AblyComp2 = () => {
//   const testDailyStats = {
//     gotdId: 3,
//     modeId: 1,
//     attempts: 1,
//     guesses: [],
//     found: true,
//     info: { message: "funky monks" },
//     real: false,
//   }

//   const testUnlimitedStats = {
//     igdbId: 1443,
//     modeId: 5,
//     attempts: 1,
//     guesses: [],
//     found: true,
//     info: { message: "just like a pill :D" },
//     real: false,
//   }

//   useEffect(() => {
//     channel.subscribe('dailyStatsSaved', (message) => {
//       console.info('Received data:', message.data);
//     });

//     channel.subscribe('unlimitedStatsSaved', (message) => {
//       console.info('Received data:', message.data);
//     });

//     return () => {
//       channel.unsubscribe();
//     };
//   }, []);

//   const sendDailyStats = () => {
//     channel.publish('saveDailyStats', testDailyStats);
//   };

//   const sendUnlimitedStats = () => {
//     channel.publish('saveUnlimitedStats', testUnlimitedStats);
//   };

//   return (
//     <>
//       <div className="mt-5">
//         <Button onClick={sendDailyStats}>
//           Publish Daily Stats (Ably)
//         </Button>
//       </div>
//       <div className="mt-5">
//         <Button onClick={sendUnlimitedStats}>
//           Publish Unlimited Stats (Ably)
//         </Button>
//       </div>
//     </>
//   );
// };

// export default AblyComp2;
