package main

// Bot AI - strategic card play with team awareness, card counting, and partner coordination

// handMemory tracks all cards played across the entire hand
type handMemory struct {
	played          map[Rank]map[Suit]bool     // played[rank][suit] = true
	playerCards     map[PlayerPosition][]Card   // cards each player has played
	suitShown       map[PlayerPosition]map[Suit]bool // suits each player has shown
	tricksWonByPos  map[PlayerPosition]int      // tricks won by each position
}

func newHandMemory() *handMemory {
	return &handMemory{
		played:         make(map[Rank]map[Suit]bool),
		playerCards:    make(map[PlayerPosition][]Card),
		suitShown:      make(map[PlayerPosition]map[Suit]bool),
		tricksWonByPos: make(map[PlayerPosition]int),
	}
}

func (m *handMemory) recordPlay(card Card, pos PlayerPosition) {
	if m.played[card.Rank] == nil {
		m.played[card.Rank] = make(map[Suit]bool)
	}
	m.played[card.Rank][card.Suit] = true
	m.playerCards[pos] = append(m.playerCards[pos], card)

	if m.suitShown[pos] == nil {
		m.suitShown[pos] = make(map[Suit]bool)
	}
	m.suitShown[pos][card.Suit] = true
}

func (m *handMemory) recordTrickWinner(pos PlayerPosition) {
	m.tricksWonByPos[pos]++
}

func (m *handMemory) wasPlayed(card Card) bool {
	if m.played[card.Rank] == nil {
		return false
	}
	return m.played[card.Rank][card.Suit]
}

func (m *handMemory) isHighCardPlayed(rank Rank, suit Suit) bool {
	return m.wasPlayed(Card{Suit: suit, Rank: rank})
}

func (m *handMemory) countPlayedInSuit(suit Suit) int {
	count := 0
	for _, suits := range m.played {
		if suits[suit] {
			count++
		}
	}
	return count
}

func (m *handMemory) hasShownSuit(pos PlayerPosition, suit Suit) bool {
	if m.suitShown[pos] == nil {
		return false
	}
	return m.suitShown[pos][suit]
}

func (m *handMemory) countTricksWon(pos PlayerPosition) int {
	return m.tricksWonByPos[pos]
}

// BotChooseHokm selects the best trump suit based on hand strength
func BotChooseHokm(hand []Card) Suit {
	suitCounts := make(map[Suit]struct {
		count     int
		highCards int
		aces      int
		kings     int
		queens    int
		jacks     int
	})

	for _, card := range hand {
		sc := suitCounts[card.Suit]
		sc.count++
		if card.Rank == Ace {
			sc.aces++
		} else if card.Rank == King {
			sc.kings++
		} else if card.Rank == Queen {
			sc.queens++
		} else if card.Rank == Jack {
			sc.jacks++
		}
		if RANK_ORDER[card.Rank] >= RANK_ORDER[Queen] {
			sc.highCards++
		}
		suitCounts[card.Suit] = sc
	}

	bestSuit := Hearts
	bestScore := -1

	for suit, sc := range suitCounts {
		score := sc.count*2 + sc.aces*8 + sc.kings*5 + sc.queens*3 + sc.jacks*1 + sc.highCards*2
		if sc.count >= 5 {
			score += 6
		} else if sc.count >= 4 {
			score += 3
		}
		// Bonus for having A+K together (solid holding)
		if sc.aces > 0 && sc.kings > 0 {
			score += 4
		}
		// Bonus for having A+K+Q (very strong holding)
		if sc.aces > 0 && sc.kings > 0 && sc.queens > 0 {
			score += 3
		}
		if score > bestScore {
			bestScore = score
			bestSuit = suit
		}
	}

	return bestSuit
}

// BotPlayCard is the main entry point for bot card selection
func BotPlayCard(state *GameState, pos PlayerPosition) *Card {
	player := state.FindPlayer(pos)
	if player == nil || len(player.Hand) == 0 {
		return nil
	}

	var playable []Card
	for _, card := range player.Hand {
		if CanPlayCard(state, pos, card) {
			playable = append(playable, card)
		}
	}
	if len(playable) == 0 {
		return &player.Hand[0]
	}

	// Build memory of played cards from the current hand
	mem := newHandMemory()
	for _, c := range state.CurrentTrick.Cards {
		if c != nil {
			// We don't know who played what in current trick from here, so record without position
			mem.recordPlay(*c, "")
		}
	}

	trickCards := state.CurrentTrick.Cards
	if len(trickCards) == 0 {
		return botLead(state, player, pos, mem)
	}

	var ledSuit Suit
	if leaderCard, ok := trickCards[state.CurrentTrick.Leader]; ok && leaderCard != nil {
		ledSuit = leaderCard.Suit
	}

	hasLedSuit := false
	for _, c := range player.Hand {
		if c.Suit == ledSuit {
			hasLedSuit = true
			break
		}
	}

	if hasLedSuit {
		return botFollow(state, player, pos, ledSuit, trickCards, mem)
	}

	if state.HokmSuit != nil {
		hasHokm := false
		for _, c := range player.Hand {
			if c.Suit == *state.HokmSuit {
				hasHokm = true
				break
			}
		}
		if hasHokm {
			return botTrump(state, player, pos, trickCards, mem)
		}
	}

	return botThrowOff(state, player, pos, trickCards, mem)
}

// botLead decides which card to play when leading a trick
func botLead(state *GameState, player *Player, pos PlayerPosition, mem *handMemory) *Card {
	hand := player.Hand
	hokmSuit := state.HokmSuit
	isHokmPlayer := pos == state.HokmPlayer

	cardsLeft := len(hand)
	tricksPlayed := 13 - cardsLeft
	earlyGame := tricksPlayed < 4
	lateGame := tricksPlayed >= 9

	// Count our trumps
	myTrumps := 0
	var trumpCards []Card
	if hokmSuit != nil {
		for _, c := range hand {
			if c.Suit == *hokmSuit {
				myTrumps++
				trumpCards = append(trumpCards, c)
			}
		}
	}

	// Count actual opponent trumps remaining (not all cards!)
	opponentTrumpsRemaining := 0
	if hokmSuit != nil {
		for _, p := range state.Players {
			if p.Team != player.Team {
				for _, c := range p.Hand {
					if c.Suit == *hokmSuit {
						opponentTrumpsRemaining++
					}
				}
			}
		}
	}

	// Partner info
	var partner *Player
	for _, p := range state.Players {
		if p.Team == player.Team && p.Position != pos {
			partner = p
			break
		}
	}

	// Score awareness
	oppScore := state.EastWestScore
	if player.Team == "ew" {
		oppScore = state.NorthSouthScore
	}
	oppCloseToWin := oppScore >= 5

	// === DEFENSE: If opponent is close to winning, play more aggressively ===
	if oppCloseToWin && hokmSuit != nil {
		// Lead trump to draw out opponent trumps
		if myTrumps >= 2 {
			best := trumpCards[0]
			for _, c := range trumpCards[1:] {
				if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
					best = c
				}
			}
			return &best
		}
		// Lead our highest non-trump to prevent opponents from winning cheaply
		for suit, cards := range groupBySuit(hand) {
			if suit == *hokmSuit {
				continue
			}
			best := cards[0]
			for _, c := range cards[1:] {
				if RANK_ORDER[c.Rank] > RANK_ORDER[best.Rank] {
					best = c
				}
			}
			return &best
		}
	}

	// === PARTNER COORDINATION: Lead suits partner can trump ===
	if partner != nil && hokmSuit != nil {
		// Check if partner is void in any suit and has trumps
		partnerTrumps := 0
		for _, c := range partner.Hand {
			if c.Suit == *hokmSuit {
				partnerTrumps++
			}
		}
		if partnerTrumps > 0 {
			// Find a suit partner is likely void in (they haven't shown it)
			for suit, cards := range groupBySuit(hand) {
				if suit == *hokmSuit {
					continue
				}
				// If we have this suit and partner hasn't shown it, lead it
				if !mem.hasShownSuit(partner.Position, suit) && len(cards) > 0 {
					// Lead lowest to let partner trump
					best := cards[0]
					for _, c := range cards[1:] {
						if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
							best = c
						}
					}
					return &best
				}
			}
		}
	}

	// === STRATEGY 1: Lead Ace of trump early if we have a strong holding ===
	if hokmSuit != nil && myTrumps >= 3 && earlyGame {
		for _, c := range trumpCards {
			if c.Rank == Ace {
				return &c
			}
		}
	}

	// === STRATEGY 2: Lead Ace/King of non-trump suits to draw out high cards ===
	if hokmSuit != nil {
		for suit, cards := range groupBySuit(hand) {
			if suit == *hokmSuit {
				continue
			}
			for _, c := range cards {
				if c.Rank == Ace {
					// Check if any opponent likely still has this suit
					if mem.countRemainingInSuit(suit, hand) > len(cards) {
						return &c
					}
				}
			}
		}
	}

	// === STRATEGY 3: Lead from longest suit, lowest card ===
	nonHokm := groupBySuit(hand)
	if hokmSuit != nil {
		delete(nonHokm, *hokmSuit)
	}

	if len(nonHokm) > 0 {
		// Find the longest non-trump suit
		var longestSuit Suit
		longestLen := 0
		for suit, cards := range nonHokm {
			if len(cards) > longestLen {
				longestLen = len(cards)
				longestSuit = suit
			}
		}

		if longestLen > 0 {
			suitCards := nonHokm[longestSuit]
			// Lead the lowest card to draw out higher cards from opponents
			best := suitCards[0]
			for _, c := range suitCards[1:] {
				if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
					best = c
				}
			}
			return &best
		}
	}

	// === STRATEGY 4: Lead low trump in late game to draw opponent trumps ===
	if hokmSuit != nil && lateGame && myTrumps >= 2 {
		best := trumpCards[0]
		for _, c := range trumpCards[1:] {
			if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
				best = c
			}
		}
		return &best
	}

	// === STRATEGY 5: Lead King if we have it and Ace is likely played ===
	if hokmSuit != nil {
		for suit, cards := range groupBySuit(hand) {
			if suit == *hokmSuit {
				continue
			}
			for _, c := range cards {
				if c.Rank == King && mem.hasCardInSuit(Ace, suit) {
					return &c
				}
			}
		}
	}

	// === STRATEGY 6: Lead trump if no good non-trump leads ===
	if hokmSuit != nil && !isHokmPlayer && myTrumps >= 2 && (lateGame || opponentTrumpsRemaining <= myTrumps) {
		best := trumpCards[0]
		for _, c := range trumpCards[1:] {
			if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
				best = c
			}
		}
		return &best
	}

	// === FALLBACK: Play lowest card ===
	best := hand[0]
	for _, c := range hand[1:] {
		if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
			best = c
		}
	}
	return &best
}

// botFollow decides which card to play when following suit
func botFollow(state *GameState, player *Player, pos PlayerPosition, ledSuit Suit, trickCards map[PlayerPosition]*Card, mem *handMemory) *Card {
	hand := player.Hand
	hokmSuit := *state.HokmSuit

	// Find current winner and their position
	var winnerCard *Card
	var winnerPos PlayerPosition
	for p, c := range trickCards {
		if c == nil {
			continue
		}
		if winnerCard == nil {
			winnerCard = c
			winnerPos = p
		} else if CanBeat(*c, *winnerCard, hokmSuit) {
			winnerCard = c
			winnerPos = p
		}
	}

	var sameCards []Card
	for _, c := range hand {
		if c.Suit == ledSuit {
			sameCards = append(sameCards, c)
		}
	}

	if len(sameCards) == 0 {
		return &hand[0]
	}

	// Check if partner is winning
	partnerWinning := false
	if winnerPos != "" {
		winnerPlayer := state.FindPlayer(winnerPos)
		if winnerPlayer != nil && winnerPlayer.Team == player.Team {
			partnerWinning = true
		}
	}

	cardsLeft := len(hand)
	earlyGame := cardsLeft > 9

	// Score awareness
	oppScore := state.EastWestScore
	if player.Team == "ew" {
		oppScore = state.NorthSouthScore
	}
	oppCloseToWin := oppScore >= 5

	// === SUPPORT PARTNER: If partner is winning, play low to save high cards ===
	if partnerWinning {
		// Play the lowest card to save high cards for later tricks
		best := sameCards[0]
		for _, c := range sameCards[1:] {
			if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
				best = c
			}
		}
		return &best
	}

	// If opponent is winning, try to win with minimal cost
	if winnerCard != nil {
		// Find cards that beat the current winner
		var winners []Card
		for _, c := range sameCards {
			if RANK_ORDER[c.Rank] > RANK_ORDER[winnerCard.Rank] {
				winners = append(winners, c)
			}
		}

		if len(winners) > 0 {
			// In early game, consider whether this trick is worth winning
			if earlyGame && len(winners) > 0 {
				// If the winner card is low (below Ten), only win if we can do it cheaply
				if RANK_ORDER[winnerCard.Rank] < RANK_ORDER[Ten] {
					// Only play the lowest winner if it's not too high
					best := winners[0]
					for _, c := range winners[1:] {
						if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
							best = c
						}
					}
					// If the cheapest winner is still high (King or Ace), check if it's worth it
					if RANK_ORDER[best.Rank] >= RANK_ORDER[King] && len(sameCards) > 2 {
						// Save the high card, play lowest instead
						lowest := sameCards[0]
						for _, c := range sameCards[1:] {
							if RANK_ORDER[c.Rank] < RANK_ORDER[lowest.Rank] {
								lowest = c
							}
						}
						return &lowest
					}
					return &best
				}
			}

			// DEFENSE: If opponent is close to winning, always try to win
			if oppCloseToWin {
				best := winners[0]
				for _, c := range winners[1:] {
					if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
						best = c
					}
				}
				return &best
			}

			// Play the lowest winning card
			best := winners[0]
			for _, c := range winners[1:] {
				if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
					best = c
				}
			}
			return &best
		}
	}

	// Can't win, play lowest to save high cards
	best := sameCards[0]
	for _, c := range sameCards[1:] {
		if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
			best = c
		}
	}
	return &best
}

// botTrump decides which card to play when trumping (ruffing)
func botTrump(state *GameState, player *Player, pos PlayerPosition, trickCards map[PlayerPosition]*Card, mem *handMemory) *Card {
	hand := player.Hand
	hokmSuit := *state.HokmSuit

	// Find current winner
	var winnerCard *Card
	var winnerPos PlayerPosition
	for p, c := range trickCards {
		if c == nil {
			continue
		}
		if winnerCard == nil {
			winnerCard = c
			winnerPos = p
		} else if CanBeat(*c, *winnerCard, hokmSuit) {
			winnerCard = c
			winnerPos = p
		}
	}

	// Check if partner is winning
	partnerWinning := false
	if winnerPos != "" {
		winnerPlayer := state.FindPlayer(winnerPos)
		if winnerPlayer != nil && winnerPlayer.Team == player.Team {
			partnerWinning = true
		}
	}

	var trumpCards []Card
	for _, c := range hand {
		if c.Suit == hokmSuit {
			trumpCards = append(trumpCards, c)
		}
	}

	if len(trumpCards) == 0 {
		return &hand[0]
	}

	cardsLeft := len(hand)
	lateGame := cardsLeft <= 4

	// Score awareness
	oppScore := state.EastWestScore
	if player.Team == "ew" {
		oppScore = state.NorthSouthScore
	}
	oppCloseToWin := oppScore >= 5

	// If partner is winning, DON'T waste trump — play lowest trump (save for later)
	if partnerWinning {
		best := trumpCards[0]
		for _, c := range trumpCards[1:] {
			if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
				best = c
			}
		}
		return &best
	}

	// If current winner is also trump, need to beat it
	if winnerCard != nil && winnerCard.Suit == hokmSuit {
		var winners []Card
		for _, c := range trumpCards {
			if RANK_ORDER[c.Rank] > RANK_ORDER[winnerCard.Rank] {
				winners = append(winners, c)
			}
		}
		if len(winners) > 0 {
			best := winners[0]
			for _, c := range winners[1:] {
				if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
					best = c
				}
			}
			return &best
		}
		// Can't beat, play lowest
		best := trumpCards[0]
		for _, c := range trumpCards[1:] {
			if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
				best = c
			}
		}
		return &best
	}

	// Current winner is not trump
	// In late game, always trump to win the trick
	if lateGame {
		best := trumpCards[0]
		for _, c := range trumpCards[1:] {
			if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
				best = c
			}
		}
		return &best
	}

	// DEFENSE: If opponent is close to winning, always trump
	if oppCloseToWin {
		best := trumpCards[0]
		for _, c := range trumpCards[1:] {
			if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
				best = c
			}
		}
		return &best
	}

	// In early/mid game, consider whether this trick is worth trumping
	if winnerCard != nil && RANK_ORDER[winnerCard.Rank] <= RANK_ORDER[Ten] {
		// Only trump if we have 3+ trumps or it's a critical trick
		opponentTricks := state.EastWestScore
		if player.Team == "ew" {
			opponentTricks = state.NorthSouthScore
		}

		// Trump if opponent is getting close to winning
		if opponentTricks >= 5 || len(trumpCards) >= 4 {
			best := trumpCards[0]
			for _, c := range trumpCards[1:] {
				if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
					best = c
				}
			}
			return &best
		}

		// Don't waste a high trump — play lowest to concede
		if len(trumpCards) >= 2 {
			sorted := sortCardsByRank(trumpCards)
			return &sorted[0]
		}
	}

	// Play lowest trump to win cheaply
	best := trumpCards[0]
	for _, c := range trumpCards[1:] {
		if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
			best = c
		}
	}
	return &best
}

// botThrowOff decides which card to discard when void in the led suit
func botThrowOff(state *GameState, player *Player, pos PlayerPosition, trickCards map[PlayerPosition]*Card, mem *handMemory) *Card {
	hand := player.Hand
	hokmSuit := state.HokmSuit

	// Find current winner
	var winnerCard *Card
	var winnerPos PlayerPosition
	for p, c := range trickCards {
		if c == nil {
			continue
		}
		if winnerCard == nil {
			winnerCard = c
			winnerPos = p
		} else if CanBeat(*c, *winnerCard, *hokmSuit) {
			winnerCard = c
			winnerPos = p
		}
	}

	// Check if partner is winning
	partnerWinning := false
	if winnerPos != "" {
		winnerPlayer := state.FindPlayer(winnerPos)
		if winnerPlayer != nil && winnerPlayer.Team == player.Team {
			partnerWinning = true
		}
	}

	// Find led suit from trick
	var ledSuit Suit
	if leaderCard, ok := trickCards[state.CurrentTrick.Leader]; ok && leaderCard != nil {
		ledSuit = leaderCard.Suit
	}

	cardsLeft := len(hand)

	// === STRATEGIC DISCARDING: Void a suit to enable future trumping ===
	if hokmSuit != nil && cardsLeft > 3 {
		suitCounts := make(map[Suit]int)
		for _, c := range hand {
			suitCounts[c.Suit]++
		}
		for suit, count := range suitCounts {
			if suit == *hokmSuit || suit == ledSuit {
				continue
			}
			if count == 1 {
				// This card would create a void — discard it
				for _, c := range hand {
					if c.Suit == suit {
						return &c
					}
				}
			}
		}
	}

	// === If partner is winning, discard highest non-trump (dump value cards) ===
	if partnerWinning {
		var nonTrump []Card
		for _, c := range hand {
			if hokmSuit == nil || c.Suit != *hokmSuit {
				nonTrump = append(nonTrump, c)
			}
		}
		if len(nonTrump) > 0 {
			best := nonTrump[0]
			for _, c := range nonTrump[1:] {
				if RANK_ORDER[c.Rank] > RANK_ORDER[best.Rank] {
					best = c
				}
			}
			return &best
		}
		// Only have trump left, play lowest
		best := hand[0]
		for _, c := range hand[1:] {
			if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
				best = c
			}
		}
		return &best
	}

	// === If opponent is winning, discard strategically ===
	// Priority: 1) Create voids  2) Dump high cards  3) Play lowest

	// First try to dump high cards from suits where we're about to run out
	suitCounts := make(map[Suit]int)
	for _, c := range hand {
		suitCounts[c.Suit]++
	}

	// Find suits where we have only non-trump cards and opponent is winning
	// Discard the highest card from our shortest non-trump suit
	var shortestSuit Suit
	shortestLen := 999
	for suit, count := range suitCounts {
		if suit == *hokmSuit || suit == ledSuit {
			continue
		}
		if count < shortestLen {
			shortestLen = count
			shortestSuit = suit
		}
	}

	if shortestLen > 0 && shortestLen <= 2 {
		// Discard highest from shortest suit
		var candidates []Card
		for _, c := range hand {
			if c.Suit == shortestSuit {
				candidates = append(candidates, c)
			}
		}
		if len(candidates) > 0 {
			best := candidates[0]
			for _, c := range candidates[1:] {
				if RANK_ORDER[c.Rank] > RANK_ORDER[best.Rank] {
					best = c
				}
			}
			return &best
		}
	}

	// Fallback: discard highest non-trump card
	var nonTrump []Card
	for _, c := range hand {
		if hokmSuit == nil || c.Suit != *hokmSuit {
			nonTrump = append(nonTrump, c)
		}
	}
	if len(nonTrump) > 0 {
		best := nonTrump[0]
		for _, c := range nonTrump[1:] {
			if RANK_ORDER[c.Rank] > RANK_ORDER[best.Rank] {
				best = c
			}
		}
		return &best
	}

	// Only trump left, play lowest
	best := hand[0]
	for _, c := range hand[1:] {
		if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
			best = c
		}
	}
	return &best
}

// === Helper functions ===

func groupBySuit(hand []Card) map[Suit][]Card {
	groups := make(map[Suit][]Card)
	for _, c := range hand {
		groups[c.Suit] = append(groups[c.Suit], c)
	}
	return groups
}

func sortCardsByRank(cards []Card) []Card {
	sorted := make([]Card, len(cards))
	copy(sorted, cards)
	for i := 0; i < len(sorted); i++ {
		for j := i + 1; j < len(sorted); j++ {
			if RANK_ORDER[sorted[j].Rank] < RANK_ORDER[sorted[i].Rank] {
				sorted[i], sorted[j] = sorted[j], sorted[i]
			}
		}
	}
	return sorted
}

// countRemainingInSuit counts how many cards of a suit are still unseen by a player
// (not in their hand and not played)
func (m *handMemory) countRemainingInSuit(suit Suit, hand []Card) int {
	total := 13
	for _, c := range hand {
		if c.Suit == suit {
			total--
		}
	}
	for _, ranks := range m.played {
		if ranks[suit] {
			total--
		}
	}
	return total
}

// hasCardInSuit checks if a specific card is still in play (not played)
func (m *handMemory) hasCardInSuit(rank Rank, suit Suit) bool {
	return !m.wasPlayed(Card{Suit: suit, Rank: rank})
}
