import { Injectable } from '@angular/core';
import { take } from 'rxjs';
import { Breed } from '../models/breed.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class BreedService extends BaseService<Breed> {
  private defaults: Breed[] = [
    // Kleine rassen
    { name: 'Affenpinscher', size: 'small' },
    { name: 'Amerikaanse Toy Terrier', size: 'small' },
    { name: 'Bichon Frisé', size: 'small' },
    { name: 'Bolognese', size: 'small' },
    { name: 'Boston Terrier', size: 'small' },
    { name: 'Brusselse Griffon', size: 'small' },
    { name: 'Cairn Terrier', size: 'small' },
    { name: 'Cavalier King Charles Spaniël', size: 'small' },
    { name: 'Chihuahua', size: 'small' },
    { name: 'Chinese Naakthond', size: 'small' },
    { name: 'Coton de Tuléar', size: 'small' },
    { name: 'Dwergkeeshond (Pomeranian)', size: 'small' },
    { name: 'Dwergpinscher', size: 'small' },
    { name: 'Dwergpoedel', size: 'small' },
    { name: 'Dwergschnauzer', size: 'small' },
    { name: 'Franse Bulldog', size: 'small' },
    { name: 'Havanezer', size: 'small' },
    { name: 'Italiaans Windhondje', size: 'small' },
    { name: 'Jack Russell Terrier', size: 'small' },
    { name: 'Japanse Chin', size: 'small' },
    { name: 'Lhasa Apso', size: 'small' },
    { name: 'Leeuwhondje (Löwchen)', size: 'small' },
    { name: 'Maltezer', size: 'small' },
    { name: 'Mopshond (Pug)', size: 'small' },
    { name: 'Norfolk Terrier', size: 'small' },
    { name: 'Norwich Terrier', size: 'small' },
    { name: 'Papillon (Vlinderhondje)', size: 'small' },
    { name: 'Pekingees', size: 'small' },
    { name: 'Russische Toy Terrier', size: 'small' },
    { name: 'Schipperke', size: 'small' },
    { name: 'Schotse Terrier', size: 'small' },
    { name: 'Sealyham Terrier', size: 'small' },
    { name: 'Shih Tzu', size: 'small' },
    { name: 'Teckel (Dwerg/Kaninchen)', size: 'small' },
    { name: 'Tibetaanse Spaniël', size: 'small' },
    { name: 'West Highland White Terrier (Westie)', size: 'small' },
    { name: 'Yorkshire Terrier', size: 'small' },
    { name: 'Kruising (klein)', size: 'small' },

    // Middelgrote rassen
    { name: 'Aidi', size: 'medium' },
    { name: 'Amerikaanse Cocker Spaniël', size: 'medium' },
    { name: 'Amerikaanse Water Spaniël', size: 'medium' },
    { name: 'Australische Herder (Australian Shepherd)', size: 'medium' },
    { name: 'Australische Kelpie', size: 'medium' },
    { name: 'Basenji', size: 'medium' },
    { name: 'Basset Hound', size: 'medium' },
    { name: 'Beagle', size: 'medium' },
    { name: 'Bearded Collie (kleinere variant)', size: 'medium' },
    { name: 'Bedlington Terrier', size: 'medium' },
    { name: 'Boerenfox', size: 'medium' },
    { name: 'Border Collie', size: 'medium' },
    { name: 'Bretonse Spaniël (Epagneul Breton)', size: 'medium' },
    { name: 'Bull Terrier', size: 'medium' },
    { name: 'Cocker Spaniël (Engelse)', size: 'medium' },
    { name: 'Drentsche Patrijshond', size: 'medium' },
    { name: 'Duitse Pinscher', size: 'medium' },
    { name: 'Engelse Springer Spaniël', size: 'medium' },
    { name: 'Entlebucher Sennenhond', size: 'medium' },
    { name: 'Finse Lappenhond', size: 'medium' },
    { name: 'Finse Spits', size: 'medium' },
    { name: 'Friese Stabij', size: 'medium' },
    { name: 'Heidewachtel', size: 'medium' },
    { name: 'Hollandse Herder', size: 'medium' },
    { name: 'Ierse Terrier', size: 'medium' },
    { name: 'IJslandse Hond', size: 'medium' },
    { name: 'Keeshond (Middelgroot)', size: 'medium' },
    { name: 'Kerry Blue Terrier', size: 'medium' },
    { name: 'Kooikerhondje', size: 'medium' },
    { name: 'Kromfohrländer', size: 'medium' },
    { name: 'Labradoodle (medium)', size: 'medium' },
    { name: 'Lagotto Romagnolo', size: 'medium' },
    { name: 'Markiesje', size: 'medium' },
    { name: 'Middelgrote Poedel', size: 'medium' },
    { name: 'Middenslagschnauzer', size: 'medium' },
    { name: 'Noorse Elandhond', size: 'medium' },
    { name: 'Nova Scotia Duck Tolling Retriever', size: 'medium' },
    { name: 'Oostenrijkse Pinscher', size: 'medium' },
    { name: 'Poolse Herdershond (Laagland)', size: 'medium' },
    { name: 'Portugese Waterhond', size: 'medium' },
    { name: 'Puli', size: 'medium' },
    { name: 'Pyrenese Herdershond', size: 'medium' },
    { name: 'Samoyed (kleinere variant)', size: 'medium' },
    { name: 'Shar-Pei', size: 'medium' },
    { name: 'Shetland Sheepdog (Sheltie)', size: 'medium' },
    { name: 'Shiba Inu', size: 'medium' },
    { name: 'Siberische Husky (kleinere variant)', size: 'medium' },
    { name: 'Soft Coated Wheaten Terrier', size: 'medium' },
    { name: 'Spaanse Waterhond', size: 'medium' },
    { name: 'Staffordshire Bull Terrier', size: 'medium' },
    { name: 'Tibetaanse Terrier', size: 'medium' },
    { name: 'Welshe Corgi Cardigan', size: 'medium' },
    { name: 'Welshe Corgi Pembroke', size: 'medium' },
    { name: 'Welsh Springer Spaniel', size: 'medium' },
    { name: 'Whippet', size: 'medium' },
    { name: 'Kruising (middel)', size: 'medium' },

    // Grote rassen
    { name: 'Afghaanse Windhond', size: 'large' },
    { name: 'Airedale Terrier', size: 'large' },
    { name: 'Akita Inu', size: 'large' },
    { name: 'Alaskan Malamute', size: 'large' },
    { name: 'American Staffordshire Terrier', size: 'large' },
    { name: 'Argentijnse Dog', size: 'large' },
    { name: 'Barbet', size: 'large' },
    { name: 'Barsoi', size: 'large' },
    { name: 'Bearded Collie', size: 'large' },
    { name: 'Beauceron', size: 'large' },
    { name: 'Belgische Herdershond', size: 'large' },
    { name: 'Berner Sennenhond', size: 'large' },
    { name: 'Bloedhond (Bloodhound)', size: 'large' },
    { name: 'Bordeauxdog', size: 'large' },
    { name: 'Bouvier des Flandres', size: 'large' },
    { name: 'Boxer', size: 'large' },
    { name: 'Briard', size: 'large' },
    { name: 'Cane Corso', size: 'large' },
    { name: 'Chesapeake Bay Retriever', size: 'large' },
    { name: 'Clumber Spaniel', size: 'large' },
    { name: 'Dalmatiër', size: 'large' },
    { name: 'Dobermann', size: 'large' },
    { name: 'Dogo Argentino', size: 'large' },
    { name: 'Duitse Dog', size: 'large' },
    { name: 'Duitse Herder', size: 'large' },
    { name: 'Duitse Staande Hond', size: 'large' },
    { name: 'Engelse Setter', size: 'large' },
    { name: 'Flat-Coated Retriever', size: 'large' },
    { name: 'Foxhound', size: 'large' },
    { name: 'Golden Retriever', size: 'large' },
    { name: 'Gordon Setter', size: 'large' },
    { name: 'Grote Poedel (Koningspoedel)', size: 'large' },
    { name: 'Grote Zwitserse Sennenhond', size: 'large' },
    { name: 'Hovawart', size: 'large' },
    { name: 'Ierse Setter', size: 'large' },
    { name: 'Ierse Water Spaniël', size: 'large' },
    { name: 'Ierse Wolfshond', size: 'large' },
    { name: 'Komondor', size: 'large' },
    { name: 'Koningpoedel', size: 'large' },
    { name: 'Kuvasz', size: 'large' },
    { name: 'Labradoodle', size: 'large' },
    { name: 'Labrador Retriever', size: 'large' },
    { name: 'Landseer ECT', size: 'large' },
    { name: 'Leonberger', size: 'large' },
    { name: 'Mastiff', size: 'large' },
    { name: 'Mastino Napoletano', size: 'large' },
    { name: 'Newfoundlander', size: 'large' },
    { name: 'Old English Sheepdog', size: 'large' },
    { name: 'Pointer', size: 'large' },
    { name: 'Rhodesian Ridgeback', size: 'large' },
    { name: 'Riesenschnauzer', size: 'large' },
    { name: 'Rottweiler', size: 'large' },
    { name: 'Sint Bernard', size: 'large' },
    { name: 'Slowaakse Tchouvatch', size: 'large' },
    { name: 'Tatra', size: 'large' },
    { name: 'Tosa Inu', size: 'large' },
    { name: 'Weimaraner', size: 'large' },
    { name: 'Witte Herdershond', size: 'large' },
    { name: 'Zwarte Russische Terrier', size: 'large' },
    { name: 'Kruising (groot)', size: 'large' },
  ];

  constructor() {
    super('breeds');
    this.initializeDefaults();
  }

  private initializeDefaults() {
    this.getData$()
      .pipe(take(1))
      .subscribe((existingBreeds) => {
        const breedsToAdd = this.defaults.filter(
          (defaultBreed) =>
            !existingBreeds.some(
              (existingBreed) =>
                existingBreed.name.toLowerCase() ===
                defaultBreed.name.toLowerCase(),
            ),
        );

        if (breedsToAdd.length > 0) {
          breedsToAdd.forEach((breed) => {
            this.add(breed).subscribe();
          });
        }
      });
  }
}
