const { sequelize, Video } = require('./models');

async function seed() {
  await sequelize.sync({ alter: true });

  await Video.bulkCreate([
    {
      title: 'AM26 Show – Débrief Léopards vs Maroc',
      description: 'Analyse à chaud, réactions et coulisses du match des Léopards.',
      thumbnailUrl: 'https://images.pexels.com/photos/114296/pexels-photo-114296.jpeg',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      isLive: true
    },
    {
      title: 'Dans la peau d’un Léopard – Episode 1',
      description: 'Immersion dans la préparation de la CAN avec l’équipe nationale.',
      thumbnailUrl: 'https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      isLive: false
    },
    {
      title: 'Plateau OLYMP – Polémique spéciale sélection',
      description: 'Débat enflammé autour de la liste des 23.',
      thumbnailUrl: 'https://images.pexels.com/photos/799090/pexels-photo-799090.jpeg',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      isLive: false
    }
  ]);

  console.log('Seed terminé');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
