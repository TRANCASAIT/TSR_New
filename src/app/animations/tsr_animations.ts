import { trigger, state, style, transition, animate } from '@angular/animations';

export const rightToLeftAnimation = [
  trigger('rightToLeftAnimation', [
    state('void', style({
      transform: 'translateX(100%)',
      opacity: 0
    })),
    state('*', style({
      transform: 'translateX(0)',
      opacity: 1
    })),
    transition('void => *', [
      animate('400ms ease-in-out')
    ]),
    transition('* => void', [
      animate('400ms ease-in-out')
    ]),
  ])
];


export const leftToRightAnimation = [
  trigger('leftToRightAnimation', [
    state('void', style({
      transform: 'translateX(-100%)',
      opacity: 0
    })),
    state('*', style({
      transform: 'translateX(0)',
      opacity: 1
    })),
    transition('void => *', [
      animate('400ms ease-in-out')
    ]),
    transition('* => void', [
      animate('400ms ease-in-out')
    ]),
  ])
];

export const topToBottomAnimation = [
  trigger('topToBottomAnimation', [
    state('void', style({
      transform: 'translateY(-100%)',
      opacity: 0
    })),
    state('*', style({
      transform: 'translateY(0)',
      opacity: 1
    })),
    transition('void <=> *', animate('600ms ease-in-out')),
  ])
]

export const bottomToTopAnimation = [
  trigger('bottomToTopAnimation', [
    state('void', style({
      transform: 'translateY(100%)',
      opacity: 0
    })),
    state('*', style({
      transform: 'translateY(0)',
      opacity: 1
    })),
    transition('void <=> *', animate('600ms ease-in-out')),
  ])
]
