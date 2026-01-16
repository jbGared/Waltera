Lis "docs/WALTERRA_MISSIONS_COMPLETE.md".
Je souhaite continuer la mission 2 pour laquelle le client a de nombreuses demandes. Certaines ont déjà commencé à être créées et d'autres sont encore en suspens. Aujourd'hui, le client a la possibilité de consulter les conventions collectives nationales qui sont dans la base CCN de Superbase. Cela se fait par l'intermédiaire de deux workflows N8N, le 06 et le 07 dont tu as les détails dans /docs/n8n. Malheureusement, ils donnent des résultats peu précis, voire pas bons du tout. Je souhaiterais donc de les remplacer par une Edge Function Superbase, exactement comme nous le faisons dans la recherche de documents clients. Il faudrait donc s'inspirer de cette Edge Function pour en créer une nouvelle dédiée à la recherche d'informations dans les conventions collectives nationales, et en s'inspirant également des promptes des agents IA des Workflows 06 et 07.
Pour la récupération des conventions collectives nationales, j'utilise un workflow N8N qui est le workflow N8N commençant par le numéro 05. Ce workflow est lancé automatiquement tous les jours, une fois par jour, ou il peut être lancé à la demande du client. Il va récupérer les chunks des conventions collectives nationales sur l'Egypte France et va aller les stocker dans la base de données CCN de Superbase. C'est cette base de données qui sert de source pour le chatbot de recherche CCN. Étant donné que ce workflow d'import tourne tous les jours, il va également chercher tous les jours les mises à jour qui peuvent avoir été effectuées sur des CCN dont dépendent les clients de Waltera. Si une modification de convention collective nationale impacte une convention collective dont dépend un ou plusieurs clients de Walter A, alors ces derniers souhaitent recevoir une notification. Ils ne veulent obtenir des notifications que pour les modifications qui impactent les sujets suivants. Ils m'ont donné cette liste de termes qui doivent, s'ils apparaissent, faire remonter une alerte auprès d'eux par e-mail : 
Mutuelle
Assurance santé
Prévoyance
Complémentaire santé
Remboursement
Cotisation
Conventionnement
Délai de carence
Garantie
Dispenses
Portabilité
Maladie, maternité, accident du travail
Indemnisation des absences
Maintien du salaire brut
IJSS + RP
Maladie
Accident de travail
Retraite complémentaire
Régimes de prévoyance
Régime Frais de santé
Organismes assureurs
Recommandés
Co recommandés
garanties incapacité, invalidité et décès
rentes
taux
répartition
prestations
Salaire de référence
Double effet
Frais d’obsèques
Rente éducation

Rente conjoint
Rente de conjoint
Rente temporaire
Rente viagère
Plancher
Plafond
Rente de survie handicap
Bénéficiaires
Organismes assureurs
Assiette
PMSS
Plafond mensuel de la Sécurité sociale
Exonération
Couverture
Socle conventionnel
Alsace- Moselle / régime local
Isolé
Famille
Conjoint
Enfant à charge
Couverture obligatoire / facultative
Ayant droit
Gratuité à partir xx enfant
Option / Optionnelle
Facultatif / obligatoire
Couverture
Répartition employeur / salarié
Prestations
chirurgicaux et d’hospitalisation
HDS : Haut degré de solidarité / degré élevé de solidarité
Actions prévention
Fonds mutualisé de solidarité

conformément à la loi, 2 % des cotisations des régimes conventionnels de prévoyance et de
frais de santé sont affectés aux prestations à caractère non directement contributif.
Organisme
Gestionnaire
Collectif / collective
personnel affilié à l’AGIRC
personnel non affilié à l’AGIRC
Tranche 1
Tranche 2
Tranche A
Tranche B
Tranche C
1° / 2° / 3° catégorie
Ancienneté
Bénéficiaires
Maintien rémunération
Salaire mensuel
Brut / net
Ancienneté
Accident
Frais de soins
100% santé
Base de remboursement BR
SS : Sécurité sociale
OPTAM / Non Optam
OPTAM-CO / Non Optam-CO
DPTAM / non DPTAM
Conventionné / non conventionné
Tableau des garanties
Soins
Frais de séjour en hospitalisation médicale ou chirurgicale
Honoraires
Maternité

La chambre particulière (y compris la maternité)
Le lit d&#39;accompagnant
Forfait journalier d&#39;hospitalisation
Soins médicaux et pharmacie
Soins médicaux courants
Actes de pratique médicale courante tels que :
- Consultations, visites
- Auxiliaires médicaux
- Actes d&#39;imagerie hors échographie
- Actes d&#39;échographie, Doppler
- Analyses, laboratoires
- Transport du malade
Pharmacie
Monture et verres
Chirurgie réfractive
Lentilles prises en charge ou non par la sécurité sociale
Audiologie
Prothèses auditives
Soins et prothèses dentaires
- L&#39;orthodontie
Les implants dentaires
Parodontologie
Médecine douce
Ostéopathe, chiropracteur, homéopathe, diététicien, étiopathe, naturopathe, acupuncteur,
psychomotricité
Prévention
- Sevrage tabagique
Vaccin

donc je récapitule, si une modification impacte une ou plusieurs conventions collectives dont dépendent des clients et que cette modification comporte un des termes de la liste précédente, alors une notification doit être générée. Par ailleurs, il faut également que l'agent IA aille regarder tous les documents contractuels des clients concernés et puisse vérifier si la modification a un impact potentiel sur les garanties du contrat et sur la rédaction des contrats et autres documents contractuels. Si c'est le cas, il faudra alors que cela soit indiqué dans la notification reçue par Waltera.
Depuis le chatbot CCN, disponible sur la page /CCN, WALTERA souhaite pouvoir poser des questions et obtenir des réponses précises en utilisant la Edge Function dont on a parlé un peu plus haut, qui va utiliser le même ordre de tri des documents que les agents IA des Workflows et Mutants actuelles, en mettant en avant la priorité des textes les uns sur les autres et le fait que les textes soient encore valides au moment de la demande, etc. Il faudra vérifier cela dans les promptes actuels des agents IA. 
le client souhaite également pouvoir gérer sa base de données CCN de Superbase en y ajoutant potentiellement de nouvelles CCN. Il peut le faire aujourd'hui depuis une page qui a été créée spécifiquement et qui s'appelle ccn/gestion cette page existe mais doit être intégralement revue car je ne suis pas du tout fan du design utilisé et je trouve qu'elle n'est pas simple à utiliser. Il faut quelque chose de moderne dans l'air du temps et qui soit très clair et simple à utiliser. L'objectif étant pour eux de disposer de la liste de toutes les conventions collectives nationales disponibles en France. Pour rappel, il y a plus de 650 conventions collectives nationales en France aujourd'hui, même si 80% des entreprises sont regroupées au sein de à peine 50 de ces conventions collectives nationales. Ils doivent donc avoir accès à la liste, pouvoir piocher dedans, en choisir une ou plusieurs et demander à ce qu'elles soient intégrées dans la base de données CCN Superbase. C'est alors le workflow N8N 05 qui est utilisé pour ces différentes CCN pour pouvoir les intégrer dans la base de données. Elles sont ensuite consultables comme les autres conventions collectives en base de données.
Sur la base de toutes ces informations, pourrais-tu créer la fiche SOP récapitulant l'ensemble des demandes du client relatives aux conventions collectives nationales ? Une fois créé, ce document devra être placé dans le répertoire docs/SOP il sera ensuite utilisé par Claude Code afin de développer ses différentes fonctionnalités. 