describe('Todo Management Business Process', () => {
    beforeEach(() => {
        cy.task('cleanupUsers');
    });

    it('produces correct login and welcome experience through the complete todo management workflow', () => {
        // Phase 1: Unauthenticated user visits home page and sees login form
        cy.visit('/');
        cy.get('[aria-label="Login form"]').should('be.visible');
        cy.get('[aria-label="Username input"]').should('be.visible');
        cy.contains('button', 'Sign In').should('be.visible');

        // Phase 2: User enters a username and submits the form
        cy.get('[aria-label="Username input"]').type('testuser');
        cy.contains('button', 'Sign In').click();

        // Phase 3: User sees welcome message and login form is gone
        cy.contains('Welcome, testuser').should('be.visible');
        cy.get('[aria-label="Login form"]').should('not.exist');

        // Phase 4: Verify the user was created in the database
        cy.task('getUserByUsername', 'testuser').then((user) => {
            expect(user).to.not.be.null;
            expect(user).to.have.property('username', 'testuser');
        });
    });
});
