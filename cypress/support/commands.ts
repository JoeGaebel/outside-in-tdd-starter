Cypress.Commands.add('login', (username = 'testuser') => {
  cy.visit('/');
  cy.get('[aria-label="Username input"]').type(username);
  cy.contains('button', 'Sign In').click();
  cy.contains(`Welcome, ${username}`).should('be.visible');
});
