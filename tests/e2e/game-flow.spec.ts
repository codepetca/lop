import { test, expect } from '@playwright/test'

test.describe('Multiplayer Game Flow', () => {
  test('should complete full game flow with multiple players', async ({ page, context }) => {
    // Navigate to the game
    await page.goto('/')
    
    // Check that campaigns load
    await expect(page.getByText('Forest Quest')).toBeVisible()
    
    // Enter player name
    await page.fill('input[id="player-name"]', 'Alice')
    
    // Select campaign
    await page.click('button:has-text("Forest Quest")')
    
    // Join game
    await page.click('button:has-text("Join Game")')
    
    // Should navigate to game room
    await expect(page).toHaveURL(/\/game\//)
    
    // Should see the scene title
    await expect(page.getByText('Forest Entrance')).toBeVisible()
    
    // Should see waiting state initially
    await expect(page.getByText('Waiting to start')).toBeVisible()
    
    // Open second player in new tab
    const secondPlayer = await context.newPage()
    await secondPlayer.goto('/')
    
    // Second player joins
    await secondPlayer.fill('input[id="player-name"]', 'Bob')
    await secondPlayer.click('button:has-text("Forest Quest")')
    await secondPlayer.click('button:has-text("Join Game")')
    
    // Should see both players in game
    await expect(page.getByText('Alice')).toBeVisible()
    await expect(page.getByText('Bob')).toBeVisible()
    
    // Start the game
    await page.click('button:has-text("Start Game")')
    
    // Should see voting interface
    await expect(page.getByText('Vote now!')).toBeVisible()
    
    // Should see clickable targets
    await expect(page.getByText('Go Left')).toBeVisible()
    await expect(page.getByText('Go Right')).toBeVisible()
    
    // Both players vote
    await page.click('button:has-text("Go Left")')
    await secondPlayer.click('button:has-text("Go Right")')
    
    // Should see vote counts
    await expect(page.getByText('1 votes')).toBeVisible()
    
    // Wait for voting to complete and scene transition
    await expect(page.getByText('Processing votes')).toBeVisible()
    
    // Should transition to next scene (Go Right wins)
    await expect(page.getByText('Victory!')).toBeVisible({ timeout: 10000 })
  })

  test('should handle single player flow', async ({ page }) => {
    await page.goto('/')
    
    // Enter player details and join
    await page.fill('input[id="player-name"]', 'Solo Player')
    await page.click('button:has-text("Forest Quest")')
    await page.click('button:has-text("Join Game")')
    
    // Should be in game room
    await expect(page).toHaveURL(/\/game\//)
    await expect(page.getByText('Solo Player')).toBeVisible()
    
    // Should not show start button with only 1 player
    await expect(page.getByText('Start Game')).not.toBeVisible()
    
    // Should show waiting message
    await expect(page.getByText('Waiting to start')).toBeVisible()
  })

  test('should display scene images and targets correctly', async ({ page }) => {
    await page.goto('/')
    
    await page.fill('input[id="player-name"]', 'Test Player')
    await page.click('button:has-text("Forest Quest")')
    await page.click('button:has-text("Join Game")')
    
    // Should see scene image
    const sceneImage = page.locator('.scene-image')
    await expect(sceneImage).toBeVisible()
    
    // Should have valid image source
    const imageSrc = await sceneImage.getAttribute('src')
    expect(imageSrc).toContain('picsum.photos')
    
    // Should see correctly positioned targets
    const targets = page.locator('.target')
    await expect(targets).toHaveCount(2)
    
    // Targets should have proper positioning
    const leftTarget = page.getByText('Go Left')
    const rightTarget = page.getByText('Go Right')
    
    await expect(leftTarget).toBeVisible()
    await expect(rightTarget).toBeVisible()
  })

  test('should handle voting timer correctly', async ({ page, context }) => {
    // Set up two players
    await page.goto('/')
    await page.fill('input[id="player-name"]', 'Player 1')
    await page.click('button:has-text("Forest Quest")')
    await page.click('button:has-text("Join Game")')
    
    const player2 = await context.newPage()
    await player2.goto('/')
    await player2.fill('input[id="player-name"]', 'Player 2')
    await player2.click('button:has-text("Forest Quest")')
    await player2.click('button:has-text("Join Game")')
    
    // Start the game
    await page.click('button:has-text("Start Game")')
    
    // Should see timer countdown
    await expect(page.getByText('Vote now!')).toBeVisible()
    
    // Timer should be counting down
    const timer = page.locator('.time-text')
    await expect(timer).toBeVisible()
    
    // Should see progress bar
    const progressBar = page.locator('.progress-fill')
    await expect(progressBar).toBeVisible()
    
    // Vote before timer expires
    await page.click('button:has-text("Go Left")')
    await player2.click('button:has-text("Go Right")')
    
    // Should transition after all votes are cast
    await expect(page.getByText('Processing votes')).toBeVisible()
  })

  test('should handle connection errors gracefully', async ({ page }) => {
    await page.goto('/')
    
    await page.fill('input[id="player-name"]', 'Test Player')
    await page.click('button:has-text("Forest Quest")')
    
    // Mock network failure by blocking WebSocket connections
    await page.route('**/ws', route => route.abort())
    
    await page.click('button:has-text("Join Game")')
    
    // Should show connection error
    await expect(page.getByText('Connection Error')).toBeVisible({ timeout: 10000 })
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/')
    
    // UI should be responsive
    await expect(page.locator('input[id="player-name"]')).toBeVisible()
    await expect(page.getByText('Forest Quest')).toBeVisible()
    
    // Campaign selection should work on mobile
    await page.fill('input[id="player-name"]', 'Mobile Player')
    await page.click('button:has-text("Forest Quest")')
    await page.click('button:has-text("Join Game")')
    
    // Game UI should be mobile-friendly
    await expect(page.getByText('Mobile Player')).toBeVisible()
    
    // Scene image should be responsive
    const sceneImage = page.locator('.scene-image')
    await expect(sceneImage).toBeVisible()
    
    // Targets should be appropriately sized for mobile
    const targets = page.locator('.target')
    await expect(targets.first()).toBeVisible()
  })
})