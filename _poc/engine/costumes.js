// The Buried Bell cast in layered outfits (the outfit system in newchar.js): the reference's way of dressing people -
// shirts under vests and coats, collars, neckerchiefs, buttons, pockets, piping, belts, chains, plaid and stripes -
// in our own colours. COSTUME.<name> is a character; held props are added per scene.
// Grown men (2026-11-02): the guard's face (rx 46, ry 58, jaw .8 - the user's pick) under the WIDE option C hair
// (hairW 1.17, hairH 1.09: a broad flat-topped bowl like the helmet; tight hair made eggs), beards, moustaches, heavier
// brows - the user saw the first bell cast as kids. Bald heads are made wider instead.
(function () {
const MB = { sh: -395, hem: -205, bodyW: 46, rx: 46, ry: 58, jaw: .8, arm: 96, thickBrow: true, hairW: 1.17, hairH: 1.09 }, FB = { sh: -378, hem: -202, bodyW: 37, rx: 43, ry: 56, jaw: .1, arm: 96 };
window.COSTUME = {
  // the mayor: a long plum coat with gold piping over a mustard waistcoat, watch chain, white cravat
  mayor: { ...MB, rx: 52, ry: 56, bodyW: 54, hair: 'bald', hairCol: '#8a7a6a', stache: '#6a4a2a', beard: 'goatee', beardCol: '#7a6a5a', top: '#6a2a8a', shoe: '#2a1810', longSleeve: true, wrinkles: .35,
    outfit: { kind: 'coat', col: '#6a2a8a', inner: '#e8b830', innerButtons: '#8a5a12', trim: '#f2c84a', chain: true, tie: 'cravat', tieCol: '#f6f0e4', buttons: '#f2c84a', pockets: true } },
  // the buyer: cream shirt, a stitched leather vest with flap pockets, a red neckerchief, belt; a short beard
  buyer: { ...MB, hair: 'buzz', hairCol: '#3a2618', beard: 'short', top: '#efe2c4', shoe: '#5a3a22', wrinkles: .12,
    outfit: { kind: 'vest', col: '#8a5230', stitch: 'rgba(255,230,190,.55)', pockets: true, buttons: '#e8d0a0', tie: 'kerchief', tieCol: '#d8382e', belt: '#3a2414' } },
  // a guard: chain-mail sleeves, a red tabard with a cream cross and gold trim, a belt; broad, with a moustache
  guard: { ...MB, bodyW: 52, hair: 'buzz', hairCol: '#3a2a20', stache: '#3a2a20', hat: 'kettle', top: '#9aa2ae', shoe: '#2a2018', stubble: .25,
    outfit: { pat: 'mail', patCol: 'rgba(40,46,60,.45)', kind: 'tabard', col: '#c8322e', cross: '#f4ead2', trim: '#e8b830', belt: '#2a1a12', buckle: '#c8c8c8' } },
  // a digger: a blue-and-white striped shirt, braces, a belt; a full beard
  digger1: { ...MB, hair: 'buzz', hairCol: '#2a1c16', beard: 'full', top: '#f2f0ea', shoe: '#3a2a1a',
    outfit: { pat: 'stripe', patCol: 'rgba(50,90,170,.75)', suspenders: '#7a4a24', belt: '#3a2618', buckle: '#9a9a9a', tie: 'kerchief', tieCol: '#e8a030' } },
  // another: a mossy plaid shirt under a dark waistcoat; a moustache and stubble
  digger2: { ...MB, bodyW: 50, hair: 'short', hairCol: '#5a3a22', stache: '#4a2e1a', top: '#5f8a4a', shoe: '#3a2a1a', stubble: .3,
    outfit: { pat: 'plaid', patCol: 'rgba(30,50,20,.4)', kind: 'vest', col: '#3a3440', buttons: '#c8b078', pockets: true, collar: '#f2ead8' } },
  // the farmer: a red plaid shirt, a green vest with a brown trim, belt (approved as he was)
  farmer: { ...MB, bodyW: 44, thickBrow: false, hair: 'buzz', hairCol: '#7a5a3a', top: '#d8503a', shoe: '#4a3020', stubble: .25, wrinkles: .2,
    outfit: { pat: 'plaid', patCol: 'rgba(80,20,10,.4)', kind: 'vest', col: '#3f7a4a', trim: '#7a4a24', buttons: '#e8d0a0', belt: '#3a2414' } },
  // a townswoman: a cream blouse, a blue laced bodice with gold trim, a white apron, a bow at the neck
  woman: { ...FB, hair: 'long', hairCol: '#6a3a1e', top: '#f4ead8', shoe: '#5a3a22', blush: .12,
    outfit: { kind: 'bodice', col: '#2f62b8', trim: '#e8b830', lace: '#f4ead8', apron: '#fbf6ec', tie: 'bow', tieCol: '#d8382e' } },
};
})();
