package main

// Bot AI - ports the TypeScript bot logic

func BotChooseHokm(hand []Card) Suit {
	suitCounts := make(map[Suit]struct {
		count     int
		highCards int
	})

	for _, card := range hand {
		sc := suitCounts[card.Suit]
		sc.count++
		if RANK_ORDER[card.Rank] >= RANK_ORDER[Queen] {
			sc.highCards++
		}
		suitCounts[card.Suit] = sc
	}

	bestSuit := Hearts
	bestScore := -1

	for suit, sc := range suitCounts {
		score := sc.count*2 + sc.highCards*3
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

	// Filter playable cards
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
		return leadCard(state, player.Hand)
	}

	// Find led suit
	var ledSuit Suit
	for _, c := range trickCards {
		if c != nil {
			ledSuit = c.Suit
			break
		}
	}

	hasLedSuit := false
	for _, c := range player.Hand {
		if c.Suit == ledSuit {
			hasLedSuit = true
			break
		}
	}

	if hasLedSuit {
		return followSuit(state, player.Hand, trickCards)
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
			return trumpCard(state, player.Hand)
		}
	}

	return throwOff(player.Hand)
}

func leadCard(state *GameState, hand []Card) *Card {
	hokmSuit := state.HokmSuit

	if hokmSuit != nil {
		var hokmCards []Card
		for _, c := range hand {
			if c.Suit == *hokmSuit {
				hokmCards = append(hokmCards, c)
			}
		}
		if len(hokmCards) >= 3 {
			best := hokmCards[0]
			for _, c := range hokmCards[1:] {
				if RANK_ORDER[c.Rank] > RANK_ORDER[best.Rank] {
					best = c
				}
			}
			return &best
		}
	}

	// Lead from longest non-trump suit
	nonHokm := make(map[Suit][]Card)
	for _, c := range hand {
		if hokmSuit == nil || c.Suit != *hokmSuit {
			nonHokm[c.Suit] = append(nonHokm[c.Suit], c)
		}
	}

	if len(nonHokm) > 0 {
		var longestSuit Suit
		longestLen := 0
		for suit, cards := range nonHokm {
			if len(cards) > longestLen {
				longestLen = len(cards)
				longestSuit = suit
			}
		}

		best := nonHokm[longestSuit][0]
		for _, c := range nonHokm[longestSuit][1:] {
			if RANK_ORDER[c.Rank] > RANK_ORDER[best.Rank] {
				best = c
			}
		}
		return &best
	}

	// Fallback: highest card
	best := hand[0]
	for _, c := range hand[1:] {
		if RANK_ORDER[c.Rank] > RANK_ORDER[best.Rank] {
			best = c
		}
	}
	return &best
}

func followSuit(state *GameState, hand []Card, trickCards map[PlayerPosition]*Card) *Card {
	hokmSuit := *state.HokmSuit

	// Find current winner
	var winnerCard *Card
	for _, c := range trickCards {
		if c == nil {
			continue
		}
		if winnerCard == nil {
			winnerCard = c
		} else if CanBeat(*c, *winnerCard, hokmSuit) {
			winnerCard = c
		}
	}

	// Find led suit
	var ledSuit Suit
	for _, c := range trickCards {
		if c != nil {
			ledSuit = c.Suit
			break
		}
	}

	var sameCards []Card
	for _, c := range hand {
		if c.Suit == ledSuit {
			sameCards = append(sameCards, c)
		}
	}

	// Try to win
	if winnerCard != nil {
		for _, c := range sameCards {
			if RANK_ORDER[c.Rank] > RANK_ORDER[winnerCard.Rank] {
				return &c
			}
		}
	}

	// Play lowest in led suit
	if len(sameCards) > 0 {
		best := sameCards[0]
		for _, c := range sameCards[1:] {
			if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
				best = c
			}
		}
		return &best
	}

	return &hand[0]
}

func trumpCard(state *GameState, hand []Card) *Card {
	hokmSuit := *state.HokmSuit
	var hokmCards []Card
	for _, c := range hand {
		if c.Suit == hokmSuit {
			hokmCards = append(hokmCards, c)
		}
	}
	if len(hokmCards) > 0 {
		best := hokmCards[0]
		for _, c := range hokmCards[1:] {
			if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
				best = c
			}
		}
		return &best
	}
	return &hand[0]
}

func throwOff(hand []Card) *Card {
	best := hand[0]
	for _, c := range hand[1:] {
		if RANK_ORDER[c.Rank] < RANK_ORDER[best.Rank] {
			best = c
		}
	}
	return &best
}
