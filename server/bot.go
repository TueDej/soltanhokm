package main

// Bot AI - tactical card play with team awareness

func BotChooseHokm(hand []Card) Suit {
	suitCounts := make(map[Suit]struct {
		count     int
		highCards int
		aces      int
	})

	for _, card := range hand {
		sc := suitCounts[card.Suit]
		sc.count++
		if RANK_ORDER[card.Rank] >= RANK_ORDER[Queen] {
			sc.highCards++
		}
		if card.Rank == Ace {
			sc.aces++
		}
		suitCounts[card.Suit] = sc
	}

	bestSuit := Hearts
	bestScore := -1

	for suit, sc := range suitCounts {
		score := sc.count*2 + sc.highCards*3 + sc.aces*5
		if sc.count >= 5 {
			score += 4
		}
		if score > bestScore {
			bestScore = score
			bestSuit = suit
		}
	}

	return bestSuit
}

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

	trickCards := state.CurrentTrick.Cards
	if len(trickCards) == 0 {
		return botLead(state, player, pos)
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
		return botFollow(state, player, pos, ledSuit, trickCards)
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
			return botTrump(state, player, pos, trickCards)
		}
	}

	return botThrowOff(state, player, pos, trickCards)
}

func botLead(state *GameState, player *Player, pos PlayerPosition) *Card {
	hand := player.Hand
	hokmSuit := state.HokmSuit
	isHokmPlayer := pos == state.HokmPlayer

	// Check if we have winning cards (Aces or high trumps)
	if hokmSuit != nil {
		var topTrumps []Card
		for _, c := range hand {
			if c.Suit == *hokmSuit {
				topTrumps = append(topTrumps, c)
			}
		}
		// Lead with Ace of trump if we have it and it's early
		if len(topTrumps) > 0 && len(hand) > 10 {
			for _, c := range topTrumps {
				if c.Rank == Ace {
					return &c
				}
			}
		}
	}

	// Lead from longest non-trump suit with high cards
	nonHokm := make(map[Suit][]Card)
	for _, c := range hand {
		if hokmSuit == nil || c.Suit != *hokmSuit {
			nonHokm[c.Suit] = append(nonHokm[c.Suit], c)
		}
	}

	// Find suits with Aces or Kings
	for suit, cards := range nonHokm {
		for _, c := range cards {
			if c.Rank == Ace || c.Rank == King {
				return &c
			}
		}
		_ = suit
	}

	// Lead from longest suit, lowest card (to draw out)
	var longestSuit Suit
	longestLen := 0
	for suit, cards := range nonHokm {
		if len(cards) > longestLen {
			longestLen = len(cards)
			longestSuit = suit
		}
	}

	if longestLen > 0 {
		best := nonHokm[longestSuit][0]
		for _, c := range nonHokm[longestSuit][1:] {
			if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
				best = c
			}
		}
		return &best
	}

	// Lead trump if we have good holding and it's late game
	if hokmSuit != nil && !isHokmPlayer {
		var trumpCards []Card
		for _, c := range hand {
			if c.Suit == *hokmSuit {
				trumpCards = append(trumpCards, c)
			}
		}
		if len(trumpCards) >= 2 {
			best := trumpCards[0]
			for _, c := range trumpCards[1:] {
				if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
					best = c
				}
			}
			return &best
		}
	}

	// Fallback: play lowest card
	best := hand[0]
	for _, c := range hand[1:] {
		if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
			best = c
		}
	}
	return &best
}

func botFollow(state *GameState, player *Player, pos PlayerPosition, ledSuit Suit, trickCards map[PlayerPosition]*Card) *Card {
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

	// If partner is winning, play lowest card to let them win
	if partnerWinning {
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
		// Find lowest card that beats current winner
		var winners []Card
		for _, c := range sameCards {
			if RANK_ORDER[c.Rank] > RANK_ORDER[winnerCard.Rank] {
				winners = append(winners, c)
			}
		}

		if len(winners) > 0 {
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

func botTrump(state *GameState, player *Player, pos PlayerPosition, trickCards map[PlayerPosition]*Card) *Card {
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

	// If partner is winning, don't waste trump
	if partnerWinning {
		best := trumpCards[0]
		for _, c := range trumpCards[1:] {
			if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
				best = c
			}
		}
		return &best
	}

	// Try to win with lowest trump that beats current winner
	if winnerCard != nil && winnerCard.Suit == hokmSuit {
		// Current winner is also trump, need to beat it
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

	// Current winner is not trump, play lowest trump to win
	best := trumpCards[0]
	for _, c := range trumpCards[1:] {
		if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
			best = c
		}
	}
	return &best
}

func botThrowOff(state *GameState, player *Player, pos PlayerPosition, trickCards map[PlayerPosition]*Card) *Card {
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

	// If partner is winning, discard highest non-trump card
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
	}

	// If opponent is winning, discard lowest card
	best := hand[0]
	for _, c := range hand[1:] {
		if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
			best = c
		}
	}
	return &best
}
