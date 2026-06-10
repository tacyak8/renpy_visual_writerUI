function toVariable(name) {
  return (name || '').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

// Escape user text for inside a Ren'Py "..." string. Quotes AND newlines must be
// escaped — a raw newline mid-string breaks the parse.
function escapeText(s) {
  return (s || '').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n');
}

function getTimePeriods(timePeriods) {
  switch (timePeriods) {
    case 'four': return ['Morning', 'Afternoon', 'Evening', 'Night'];
    case 'three': return ['Morning', 'Afternoon', 'Evening'];
    case 'two': return ['Day', 'Night'];
    default: return ['All Day'];
  }
}

function generateDefines(gameData) {
  const lines = [];
  lines.push('# ============================================================');
  lines.push('# DEFINES AND DEFAULTS');
  lines.push('# ============================================================');
  lines.push('');

  gameData.characters.forEach(char => {
    if (char.name) {
      const v = char.variable || toVariable(char.name);
      lines.push(`define ${v} = Character("${char.name}")`);
    }
  });

  if (gameData.characters.length > 0) lines.push('');

  if (gameData.characters.length > 0) lines.push('');

  // Player character
  if (gameData.playerMode === 'fixed' && gameData.playerName) {
    const v = gameData.playerVariable || 'player';
    lines.push(`define ${v} = Character("${gameData.playerName}")`);
    lines.push('');
  }
  if (gameData.playerMode === 'custom') {
    const v = gameData.playerVariable || 'player';
    lines.push(`default player_name = "${gameData.playerDefault || 'Player'}"`);
    lines.push(`define ${v} = Character("[player_name]")`);
    lines.push('');
  }

  gameData.pointSystems.forEach(sys => {
    if (sys.name) {
      lines.push(`default ${sys.variable || toVariable(sys.name)} = 0`);
    }
  });

  if (gameData.timePeriods !== 'none') {
    lines.push('');
    lines.push('# Time tracking');
    lines.push('default current_day = 0');
    lines.push('default current_period = 0');
    lines.push('default action_count = 0');
    const periods = getTimePeriods(gameData.timePeriods);
    lines.push(`default time_periods = ${JSON.stringify(periods)}`);
    const days = gameData.activeDays || ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    lines.push(`default active_days = ${JSON.stringify(days)}`);
  }

  lines.push('');
  lines.push('# Inventory');
  lines.push('default inventory = []');
  gameData.items.forEach(item => {
    if (item.name) {
      const v = item.variable || toVariable(item.name);
      lines.push(`default ${v}_qty = ${item.startQty || 0}`);
    }
  });

  lines.push('');
  lines.push('# Progression');
  lines.push('default current_chapter = 1');
  lines.push('');
  lines.push('# Per-playthrough visit/seen tracking (resets on a new game, saved with the save file)');
  lines.push('default visit_counts = {}');
  lines.push('');
  return lines.join('\n');
}

function generateHUDScreen(gameData) {
  const hud = gameData.hudItems || {};
  const lines = [];
  lines.push('# ============================================================');
  lines.push('# HUD SCREEN');
  lines.push('# ============================================================');
  lines.push('');
  lines.push('screen hud():');
  lines.push('    zorder 100');
  lines.push('    frame:');
  lines.push('        xalign 0.0');
  lines.push('        yalign 0.0');
  lines.push('        xpadding 10');
  lines.push('        ypadding 10');
  lines.push('        background "#00000088"');
  lines.push('        vbox:');
  lines.push('            spacing 5');

  if (hud.showDay) {
    lines.push('            text "[active_days[current_day]]" size 18 color "#ffffff"');
  }
  if (hud.showPeriod && gameData.timePeriods !== 'none') {
    lines.push('            text "[time_periods[current_period]]" size 18 color "#ffffff"');
  }
  if (hud.showChapter) {
    const label = gameData.progressionLabel || 'Chapter';
    lines.push(`            text "${label} [current_chapter]" size 18 color "#ffffff"`);
  }
  if (hud.showPoints) {
    gameData.pointSystems.forEach(sys => {
      if (!sys.name) return;
      if (sys.hudDisplay === 'hidden') return;
      const v = sys.variable || toVariable(sys.name);
      const color = sys.color || '#ffcc44';
      const maxNum = parseInt(sys.max);
      const hasMax = !isNaN(maxNum) && maxNum > 0;
      const display = sys.hudDisplay || 'bar';

      switch (display) {
        case 'bar': {
          if (hasMax) {
            // Colored label with value/max, plus a thin manual progress bar (two Solids,
            // so it doesn't depend on the project's GUI bar style).
            lines.push('            vbox:');
            lines.push('                spacing 1');
            lines.push(`                text "${sys.name}: [${v}]/${maxNum}" size 16 color "${color}"`);
            lines.push('                fixed:');
            lines.push('                    xsize 150');
            lines.push('                    ysize 8');
            lines.push('                    add Solid("#ffffff22") xysize (150, 8)');
            lines.push(`                    add Solid("${color}") xysize (int(150 * min(${v}, ${maxNum}) / float(${maxNum})), 8)`);
          } else {
            lines.push(`            text "${sys.name}: [${v}]" size 16 color "${color}"`);
          }
          break;
        }
        case 'number': {
          lines.push(`            text "${sys.name}: [${v}]" size 16 color "${color}"`);
          break;
        }
        case 'counter': {
          const icon = sys.hudIcon || '';
          if (icon) {
            lines.push('            hbox:');
            lines.push('                spacing 4');
            lines.push(`                add "${icon}" zoom 0.5`);
            lines.push(`                text "[${v}]" size 16 color "${color}"`);
          } else {
            lines.push(`            text "${sys.name}: [${v}]" size 16 color "${color}"`);
          }
          break;
        }
        case 'pips': {
          const icon = sys.hudIcon || '';
          if (icon && hasMax) {
            // N icons up to max: full opacity when "filled", 0.25 alpha when "empty".
            // Requires the icon image to exist in game/images.
            lines.push('            hbox:');
            lines.push('                spacing 2');
            lines.push(`                for i in range(${maxNum}):`);
            lines.push(`                    if i < ${v}:`);
            lines.push(`                        add "${icon}" zoom 0.4`);
            lines.push(`                    else:`);
            lines.push(`                        add "${icon}" zoom 0.4 alpha 0.25`);
          } else {
            lines.push(`            text "${sys.name}: [${v}]" size 16 color "${color}"`);
          }
          break;
        }
        default: {
          lines.push(`            text "${sys.name}: [${v}]" size 16 color "${color}"`);
          break;
        }
      }
    });
  }

  if (hud.showInventory) {
    lines.push('    frame:');
    lines.push('        xalign 1.0');
    lines.push('        yalign 0.0');
    lines.push('        background "#00000088"');
    lines.push('        textbutton "Inventory" action Show("inventory_screen")');
  }

  lines.push('');
  return lines.join('\n');
}

function generateInventoryScreen(gameData) {
  const lines = [];
  lines.push('screen inventory_screen():');
  lines.push('    modal True');
  lines.push('    frame:');
  lines.push('        xalign 0.5');
  lines.push('        yalign 0.5');
  lines.push('        xsize 600');
  lines.push('        background "#1a1a2e"');
  lines.push('        xpadding 20');
  lines.push('        ypadding 20');
  lines.push('        vbox:');
  lines.push('            spacing 10');
  lines.push('            text "Inventory" size 24 color "#ffffff"');
  lines.push('            null height 10');

  gameData.items.forEach(item => {
    if (item.name) {
      const v = item.variable || toVariable(item.name);
      lines.push(`            if ${v}_qty > 0:`);
      lines.push(`                vbox:`);
      lines.push(`                    text "${item.name}" size 18 color "#ffffff"`);
      if (item.description) {
        lines.push(`                    text "${item.description.replace(/"/g, '\\"')}" size 14 color "#aaaaaa"`);
      }
    }
  });

  lines.push('            null height 10');
  lines.push('            textbutton "Close" action Hide("inventory_screen")');
  lines.push('');
  return lines.join('\n');
}

function generateTimeAdvance(gameData) {
  const lines = [];
  lines.push('# ============================================================');
  lines.push('# TIME ADVANCE');
  lines.push('# ============================================================');
  lines.push('');
  lines.push('label advance_time():');
  const periods = getTimePeriods(gameData.timePeriods);
  lines.push(`    $ max_periods = ${periods.length}`);
  lines.push('    $ max_days = len(active_days)');
  lines.push('    $ current_period += 1');
  lines.push('    if current_period >= max_periods:');
  lines.push('        $ current_period = 0');
  lines.push('        $ current_day += 1');
  lines.push('        if current_day >= max_days:');
  lines.push('            $ current_day = 0');
  lines.push('    $ action_count = 0');
  lines.push('    return');
  lines.push('');
  return lines.join('\n');
}

// Resolve a user-typed location name to a Ren'Py label (loc_<var>_<id>).
// Matches case- and spacing-insensitively. Falls back to fallbackNode if blank.
function resolveLocationLabel(name, nodes, fallbackNode) {
  const want = toVariable(name || '');
  if (want) {
    const match = nodes.find(n => n.type === 'location' && toVariable(n.data.label) === want);
    if (match) return `loc_${toVariable(match.data.label)}_${match.id}`;
  }
  if (fallbackNode) return `loc_${toVariable(fallbackNode.data.label)}_${fallbackNode.id}`;
  return null;
}

// Resolve the wake-up location label. Matches typed name case/spacing-insensitively;
// falls back to the first location node overall.
function resolveWakeLabel(gameData, nodes) {
  const firstLoc = nodes.find(n => n.type === 'location');
  return resolveLocationLabel(gameData.dayStartLocation, nodes, firstLoc);
}

// end_day: jump target used by End Day blocks. Skips to the next morning and
// lands the player at the wake-up location.
function generateEndDay(gameData, nodes) {
  const wake = resolveWakeLabel(gameData, nodes);
  if (!wake) return '';
  const lines = [];
  lines.push('# ============================================================');
  lines.push('# END DAY');
  lines.push('# ============================================================');
  lines.push('');
  lines.push('label end_day:');
  lines.push('    $ current_period = 0');
  lines.push('    $ current_day += 1');
  lines.push('    if current_day >= len(active_days):');
  lines.push('        $ current_day = 0');
  lines.push('    $ action_count = 0');
  lines.push(`    jump ${wake}`);
  lines.push('');
  return lines.join('\n');
}

function generateBlock(block, indentLevel = 2, ctx = null) {
  const lines = [];
  const pad = '    '.repeat(indentLevel);
  if (!block) return '';

  switch (block.type) {
    case 'dialogue': {
      const speaker = block.speaker || 'narrator';
      const text = escapeText(block.text);
      if (block.sprite) lines.push(`${pad}show ${block.sprite}`);
      if (speaker === 'narrator') {
        lines.push(`${pad}"${text}"`);
      } else {
        lines.push(`${pad}${speaker} "${text}"`);
      }
      break;
    }
    case 'bg': {
      if (block.bg) lines.push(`${pad}scene ${block.bg}`);
      break;
    }
    case 'sprite': {
      if (block.sprite) lines.push(`${pad}show ${block.sprite}`);
      break;
    }
    case 'stat': {
      if (block.stat && block.amount) {
        const raw = block.amount.toString().trim();
        const isNeg = raw.startsWith('-');
        const num = Math.abs(parseInt(raw) || 0);
        const op = isNeg ? '-=' : '+=';
        lines.push(`${pad}$ ${block.stat} ${op} ${num}`);
      }
      break;
    }
    case 'item': {
      if (block.itemName) {
        const action = block.action || 'give';
        if (action === 'give') {
          lines.push(`${pad}$ ${block.itemName}_qty += 1`);
          if (block.itemImage) lines.push(`${pad}show ${block.itemImage}`);
          if (block.narratorText) lines.push(`${pad}"${escapeText(block.narratorText)}"`);
        } else if (action === 'take') {
          lines.push(`${pad}$ ${block.itemName}_qty = max(0, ${block.itemName}_qty - 1)`);
        } else if (action === 'reveal') {
          if (block.narratorText) lines.push(`${pad}"${escapeText(block.narratorText)}"`);
        }
      }
      break;
    }
    case 'pause': {
      lines.push(`${pad}pause ${block.duration || '2.0'}`);
      break;
    }
    case 'gif': {
      if (block.filename) {
        lines.push(`${pad}show ${block.filename}`);
        if (block.duration) lines.push(`${pad}pause ${block.duration}`);
        lines.push(`${pad}hide ${block.filename}`);
      }
      break;
    }
    case 'audio': {
      if (block.filename) {
        if (block.audioType === 'music') lines.push(`${pad}play music "${block.filename}"`);
        else if (block.audioType === 'sfx') lines.push(`${pad}play sound "${block.filename}"`);
        else if (block.audioType === 'stop') lines.push(`${pad}stop music`);
      }
      break;
    }
    case 'choice': {
      lines.push(`${pad}menu:`);
      (block.options || []).forEach(opt => {
        const optText = escapeText(opt.text || opt.label || '');
        lines.push(`${pad}    "${optText}":`);
        // Recursive: a consequence block that is itself a choice emits a nested menu.
        const consequenceCode = generateBlocks(opt.blocks || [], indentLevel + 2, ctx);
        if (consequenceCode) {
          lines.push(consequenceCode);
        } else {
          lines.push(`${pad}        pass`);
        }
      });
      break;
    }
    case 'question': {
      const mode = block.answerMode || 'typed';
      if (mode === 'typed') {
        const q = escapeText(block.questionText || '');
        // Case-insensitive match: lowercase both the stored answer and the input.
        const ans = escapeText((block.correctAnswer || '').trim().toLowerCase());
        lines.push(`${pad}$ player_answer = renpy.input("${q}", length=50)`);
        lines.push(`${pad}$ player_answer = player_answer.strip().lower()`);
        lines.push(`${pad}if player_answer == "${ans}":`);
        const correctCode = generateBlocks(block.correctBlocks || [], indentLevel + 1, ctx);
        lines.push(correctCode || `${pad}    pass`);
        lines.push(`${pad}else:`);
        const incorrectCode = generateBlocks(block.incorrectBlocks || [], indentLevel + 1, ctx);
        lines.push(incorrectCode || `${pad}    pass`);
      } else {
        // multiple / truefalse: emit as a menu. The "correct" flag is for the
        // designer's reference only — annotate with a comment.
        lines.push(`${pad}menu:`);
        if (block.questionText) {
          lines.push(`${pad}    "${escapeText(block.questionText)}"`);
        }
        (block.options || []).forEach(opt => {
          const optText = escapeText(opt.text || opt.label || '');
          lines.push(`${pad}    "${optText}":${opt.isCorrect ? '  # correct' : ''}`);
          const consequenceCode = generateBlocks(opt.blocks || [], indentLevel + 2, ctx);
          if (consequenceCode) {
            lines.push(consequenceCode);
          } else {
            lines.push(`${pad}        pass`);
          }
        });
      }
      break;
    }
    case 'endday': {
      // Terminal block: end the day or back out. Closeout advances to the next
      // morning at the wake-up location; "go back" re-enters the current location.
      const closeout = escapeText(block.closeoutText || 'Go to sleep');
      const back = escapeText(block.backText || 'Not yet');
      lines.push(`${pad}menu:`);
      lines.push(`${pad}    "${closeout}":`);
      lines.push(`${pad}        jump end_day`);
      lines.push(`${pad}    "${back}":`);
      if (ctx && ctx.currentLocLabel) {
        lines.push(`${pad}        jump ${ctx.currentLocLabel}`);
      } else {
        lines.push(`${pad}        pass`);
      }
      break;
    }
  }
  return lines.join('\n');
}

function generateBlocks(blocks, indentLevel = 2, ctx = null) {
  if (!blocks || blocks.length === 0) return '';
  return blocks.map(b => generateBlock(b, indentLevel, ctx)).filter(Boolean).join('\n');
}

function generateConditionExpr(condition) {
  if (!condition || !condition.type || condition.type === 'none') return null;
  switch (condition.type) {
    case 'flag': return condition.value ? condition.value : null;
    case 'stat_above': return (condition.value && condition.value2) ? `${condition.value} >= ${condition.value2}` : null;
    case 'stat_below': return (condition.value && condition.value2) ? `${condition.value} <= ${condition.value2}` : null;
    case 'item': return condition.value ? `${condition.value}_qty > 0` : null;
    case 'day': return condition.value ? `active_days[current_day] == "${condition.value}"` : null;
    default: return null;
  }
}

// Fixed: use hasattr instead of .get() for persistent
function visitGet(key, defaultVal) {
  return `visit_counts.get("${key}", ${defaultVal})`;
}

function generatePresenceExpr(interaction, locVar, period, schedulers, gameData) {
  const presence = interaction.presenceCondition || 'none';
  const target = interaction.presenceTarget || '';
  const dayKey = `active_days[current_day]`;
  const periodKey = `time_periods[current_period]`;
  // Key includes the current chapter so different chapters can have different schedules.
  const schedKey = `"chapter_{}_{}_{}".format(current_chapter, ${dayKey}, ${periodKey}.lower())`;

  switch (presence) {
    case 'none': return null;
    case 'character_present':
      if (target) return `${target}_schedule.get(${schedKey}, "") == "${locVar}"`;
      return null;
    case 'character_absent':
      if (target) return `${target}_schedule.get(${schedKey}, "") != "${locVar}"`;
      return null;
    case 'no_character': {
      const charVars = gameData.characters.map(c => c.variable || toVariable(c.name)).filter(Boolean);
      if (charVars.length === 0) return null;
      return charVars.map(v => `${v}_schedule.get(${schedKey}, "") != "${locVar}"`).join(' and ');
    }
    case 'item_present':
      if (target) return `${target}_qty > 0`;
      return null;
    default: return null;
  }
}

function generateVisitKey(interaction, locVar, period) {
  const presence = interaction.presenceCondition || 'none';
  const target = interaction.presenceTarget || '';
  const base = `${locVar}_${toVariable(period)}`;
  if (presence === 'character_present' && target) return `${base}_with_${target}`;
  if (presence === 'character_absent' && target) return `${base}_without_${target}`;
  if (presence === 'no_character') return `${base}_alone`;
  if (presence === 'item_present' && target) return `${base}_item_${target}`;
  return base;
}

function generateInteraction(interaction, locVar, locKey, period, indentLevel, schedulers, gameData) {
  const lines = [];
  const blocks = interaction.blocks || [];
  if (blocks.length === 0) return '';

  const repeatType = interaction.repeatType || 'always';
  // Visit tracking is keyed by locKey (unique per node), so two locations that
  // share a name across chapters don't share persistent counters.
  const visitKey = generateVisitKey(interaction, locKey, period);
  const countKey = `count_${visitKey}`;

  // "Situation gate": presence/extra conditions decide whether the player is even
  // in the right situation for this to count. This is separate from the repeat rule.
  const gate = [];
  const presenceExpr = generatePresenceExpr(interaction, locVar, period, schedulers, gameData);
  if (presenceExpr) gate.push(presenceExpr);
  const extraCond = generateConditionExpr(interaction.condition);
  if (extraCond) gate.push(extraCond);

  const wrapInGate = gate.length > 0;
  const baseLevel = indentLevel;
  const gateLevel = wrapInGate ? baseLevel + 1 : baseLevel;
  const padBase = '    '.repeat(baseLevel);
  const padGate = '    '.repeat(gateLevel);

  if (wrapInGate) lines.push(`${padBase}if ${gate.join(' and ')}:`);

  // Count this occurrence EVERY time the situation is reached. This must be
  // unconditional inside the gate, or "Nth time" / "after first" can never advance.
  lines.push(`${padGate}$ visit_counts["${countKey}"] = ${visitGet(countKey, '0')} + 1`);

  // Decide whether the content shows this time, using the now-reliable count.
  let showCond = null;
  if (repeatType === 'first') showCond = `${visitGet(countKey, '0')} == 1`;
  else if (repeatType === 'nth') showCond = `${visitGet(countKey, '0')} == ${interaction.visitNumber || 2}`;
  else if (repeatType === 'after_first') showCond = `${visitGet(countKey, '0')} > 1`;

  // Context for blocks that need to know where they live (e.g. End Day's "go back").
  const ctx = { currentLocLabel: `loc_${locKey}` };

  if (showCond) {
    lines.push(`${padGate}if ${showCond}:`);
    if (repeatType === 'first') {
      lines.push(`${padGate}    $ action_count += 1`);
    }
    const blockCode = generateBlocks(blocks, gateLevel + 1, ctx);
    if (blockCode) lines.push(blockCode);
  } else {
    const blockCode = generateBlocks(blocks, gateLevel, ctx);
    if (blockCode) lines.push(blockCode);
  }

  return lines.join('\n');
}

function generateTransitionContent(transNode, indentLevel = 1) {
  const lines = [];
  const pad = '    '.repeat(indentLevel);
  const blocks = transNode.data?.blocks || [];
  if (blocks.length === 0) return '';
  lines.push(generateBlocks(blocks, indentLevel));
  return lines.join('\n');
}

function generateTransitionLabel(transNode) {
  const transVar = toVariable(transNode.data?.label || 'transition');
  const lines = [];
  lines.push(`label trans_${transVar}():`);
  const content = generateTransitionContent(transNode, 1);
  if (content) {
    lines.push(content);
  } else {
    lines.push('    pass');
  }
  lines.push('    return');
  lines.push('');
  return lines.join('\n');
}

function getTransitionBetween(sourceId, targetId, nodes, edges) {
  // Find a transition node that sits between two location nodes
  return nodes.find(n => {
    if (n.type !== 'transition') return false;
    const inEdge = edges.find(e => e.target === n.id && e.source === sourceId);
    const outEdge = edges.find(e => e.source === n.id && e.target === targetId);
    return inEdge && outEdge;
  });
}

function generateShopLabel(node, gameData, nodes) {
  const d = node.data || {};
  const shopVar = toVariable(d.label || 'shop');
  // Unique label per node, same rule as locations: shop_<name>_<nodeid>.
  const shopKey = `${shopVar}_${node.id}`;
  const lines = [];

  lines.push(`label shop_${shopKey}:`);
  if (d.bg) lines.push(`    scene ${d.bg}`);
  if (d.shopkeeperSprite) lines.push(`    show ${d.shopkeeperSprite}`);

  const openingCode = generateBlocks(d.openingBlocks || [], 1);
  if (openingCode) lines.push(openingCode);

  lines.push('');
  // Separate menu label so purchases can loop back without replaying the opening.
  lines.push(`label shop_${shopKey}_menu:`);
  lines.push('    menu:');

  const items = (d.items || []).filter(it => it && it.itemVariable);
  items.forEach(it => {
    const sys = (gameData.pointSystems || []).find(s =>
      (s.variable || toVariable(s.name)) === it.pointSystem
    );
    const sysVar = it.pointSystem || (sys ? (sys.variable || toVariable(sys.name)) : '');
    const sysName = sys ? sys.name : (it.pointSystem || 'points');
    const price = parseInt(it.price) || 0;
    const name = escapeText(it.itemName || it.itemVariable);
    const desc = it.description ? ` — ${escapeText(it.description)}` : '';

    if (!sysVar) {
      // No point system selected: item is free (can't write a valid condition or charge).
      lines.push(`        "${name}${desc}":`);
      lines.push(`            $ ${it.itemVariable}_qty += 1`);
      if (it.buySprite) lines.push(`            show ${it.buySprite}`);
      if (d.loopBack) lines.push(`            jump shop_${shopKey}_menu`);
      return;
    }

    // Two mutually exclusive options per item: the player only ever sees one.
    lines.push(`        "${name} - ${price} ${sysName}${desc}" if ${sysVar} >= ${price}:`);
    lines.push(`            $ ${sysVar} -= ${price}`);
    lines.push(`            $ ${it.itemVariable}_qty += 1`);
    if (it.buySprite) lines.push(`            show ${it.buySprite}`);
    if (d.loopBack) lines.push(`            jump shop_${shopKey}_menu`);

    lines.push(`        "${name} - ${price} ${sysName} (can't afford)" if ${sysVar} < ${price}:`);
    if (it.noSaleSprite) lines.push(`            show ${it.noSaleSprite}`);
    if (d.loopBack) {
      lines.push(`            jump shop_${shopKey}_menu`);
    } else if (!it.noSaleSprite) {
      lines.push(`            pass`);
    }
  });

  // "Leave" is the only branch that falls through to the closing sequence —
  // with loopBack on, purchases jump back to the menu instead, so the shop
  // always has a working exit.
  lines.push('        "Leave":');
  lines.push('            pass');

  const closingCode = generateBlocks(d.closingBlocks || [], 1);
  if (closingCode) lines.push(closingCode);

  lines.push('    return');
  lines.push('');
  return lines.join('\n');
}

function generateLocationLabel(node, locationData, connectedLocations, gameData, schedulers, nodes, edges, chapterNum) {
  const locVar = toVariable(node.data.label);
  // Unique label name per node: two same-named locations (e.g. a cloned map in a
  // later chapter) must not both emit `label loc_foyer:` — that's a compile error.
  const locKey = `${locVar}_${node.id}`;
  const locData = locationData[node.id] || {};
  const periods = getTimePeriods(gameData.timePeriods);
  const lines = [];

  lines.push(`label loc_${locKey}:`);
  lines.push('');

  if (periods.length > 0 && gameData.timePeriods !== 'none') {
    periods.forEach((period, idx) => {
      const periodData = locData[period] || {};
      const bg = periodData.bg || '';
      const prefix = idx === 0 ? '    if' : '    elif';
      lines.push(`${prefix} current_period == ${idx}: # ${period}`);
      if (bg) {
        lines.push(`        scene ${bg}`);
      } else {
        lines.push(`        pass`);
      }
    });
    lines.push('');

    let emittedClause = false;
    periods.forEach((period, idx) => {
      const periodData = locData[period] || {};
      const interactions = periodData.interactions || [];
      // Build the body first so we can skip periods that produce no real code.
      // (An interaction with no blocks generates an empty string.)
      const bodyLines = [];
      interactions.forEach(interaction => {
        const code = generateInteraction(interaction, locVar, locKey, period, 2, schedulers, gameData);
        if (code) bodyLines.push(code);
      });
      if (bodyLines.length === 0) return;
      // Choose if/elif based on what we've actually emitted, NOT the period index —
      // otherwise a skipped first period leaves an `elif` with no opening `if`.
      const prefix = emittedClause ? '    elif' : '    if';
      emittedClause = true;
      lines.push(`${prefix} current_period == ${idx}: # ${period}`);
      bodyLines.forEach(b => lines.push(b));
    });
  } else {
    const periodData = locData['All Day'] || locData[Object.keys(locData)[0]] || {};
    const interactions = periodData.interactions || [];
    interactions.forEach(interaction => {
      const code = generateInteraction(interaction, locVar, locKey, 'all_day', 1, schedulers, gameData);
      if (code) lines.push(code);
    });
  }

  lines.push('');

  if (gameData.timePeriods !== 'none' && gameData.timeAdvance === 'actions') {
    const threshold = gameData.actionsToAdvance || 2;
    lines.push(`    if action_count >= ${threshold}:`);
    lines.push('        call advance_time()');
    lines.push('');
  }

  // Check whether the player should advance to the next chapter. This may jump
  // away (to the next chapter); if not, it returns and the nav menu shows.
  if (chapterNum != null) {
    lines.push(`    call check_progression_${chapterNum}()`);
    lines.push('');
  }

  // Navigation menu with transition support
  if (connectedLocations.length > 0) {
    lines.push('    menu:');
    lines.push('        "Where would you like to go?"');
    lines.push('');
    connectedLocations.forEach(connLoc => {
      const connVar = `${toVariable(connLoc.label)}_${connLoc.id}`;
      lines.push(`        "Go to ${connLoc.label}":`);
      // Check for transition node between these two locations
      if (nodes && edges) {
        const transNode = getTransitionBetween(node.id, connLoc.id, nodes, edges);
        if (transNode && transNode.data?.mode !== 'trigger') {
          const transVar = toVariable(transNode.data?.label || 'transition');
          if (transNode.data?.mode === 'once') {
            const onceKey = `trans_${transVar}_played`;
            lines.push(`            if not ${visitGet(onceKey, 'False')}:`);
            lines.push(`                $ visit_counts["${onceKey}"] = True`);
            lines.push(`                call trans_${transVar}()`);
          } else {
            lines.push(`            call trans_${transVar}()`);
          }
        }
      }
      if (connLoc.type === 'shop') {
        // Shops end in `return`, so they must be CALLED — a jump would leave an
        // empty call stack and the return would end the game. After shopping,
        // re-enter the current location.
        lines.push(`            call shop_${connVar}`);
        lines.push(`            jump loc_${locKey}`);
      } else {
        lines.push(`            jump loc_${connVar}`);
      }
      lines.push('');
    });
  }

  lines.push('    return');
  lines.push('');
  return lines.join('\n');
}

function generateChapterLabel(chapterNum, locationNodes, locationData, edges, gameData, progressionLabel, schedulers, allNodes) {
  const lines = [];
  lines.push(`# ============================================================`);
  lines.push(`# ${progressionLabel.toUpperCase()} ${chapterNum}`);
  lines.push(`# ============================================================`);
  lines.push('');
  lines.push(`label chapter_${chapterNum}_start:`);

  // Chapter start transitions
  if (allNodes) {
    const chapterStartTrans = allNodes.filter(n =>
      n.type === 'transition' &&
      n.data?.mode === 'trigger' &&
      n.data?.trigger === 'Chapter Start'
    );
    chapterStartTrans.forEach(t => {
      const transVar = toVariable(t.data?.label || 'transition');
      lines.push(`    call trans_${transVar}()`);
    });
  }

  if (locationNodes.length > 0) {
    let startLabel;
    if (chapterNum === 1 && gameData.gameStartLocation) {
      // Honour the explicit game-start location for chapter 1; fall back to
      // the chapter's first location node if the name doesn't resolve.
      startLabel = resolveLocationLabel(gameData.gameStartLocation, allNodes, locationNodes[0]);
    } else {
      const first = locationNodes[0];
      startLabel = `loc_${toVariable(first.data.label)}_${first.id}`;
    }
    lines.push(`    jump ${startLabel}`);
  } else {
    lines.push('    return');
  }
  lines.push('');

  locationNodes.forEach(node => {
    const connectedIds = edges
      .filter(e => e.source === node.id || e.target === node.id)
      .map(e => e.source === node.id ? e.target : e.source);

    // Nav targets: locations within this chapter, plus any connected shop node.
    const connectedLocations = connectedIds
      .map(id =>
        locationNodes.find(n => n.id === id) ||
        (allNodes || []).find(n => n.type === 'shop' && n.id === id)
      )
      .filter(Boolean)
      .map(n => ({ label: n.data.label, id: n.id, type: n.type }));

    lines.push(generateLocationLabel(node, locationData, connectedLocations, gameData, schedulers, allNodes, edges, chapterNum));
  });

  return lines.join('\n');
}

function generateSceneLabel(node) {
  const sceneVar = toVariable(node.data.label);
  const lines = [];
  lines.push(`label scene_${sceneVar}():`);
  lines.push(`    # Scene: ${node.data.label}`);

  // Linear block content plays top to bottom before any choices.
  const blocks = node.data.blocks || [];
  const blockCode = generateBlocks(blocks, 1);
  if (blockCode) lines.push(blockCode);

  const choices = node.data.choices || [];
  if (choices.length > 0) {
    lines.push('    menu:');
    choices.forEach(choice => {
      const text = (choice.text || '').replace(/"/g, '\\"');
      lines.push(`        "${text}":`);
      // Branching isn't wired yet — placeholder keeps the menu syntactically valid.
      lines.push(`            pass`);
    });
  }
  lines.push('    return');
  lines.push('');
  return lines.join('\n');
}

function generateSchedulerInit(schedulers, gameData) {
  if (!schedulers || schedulers.length === 0) return '';
  const lines = [];
  lines.push('# ============================================================');
  lines.push('# SCHEDULER');
  lines.push('# ============================================================');
  lines.push('');
  schedulers.forEach(scheduler => {
    if (!scheduler.grid) return;
    const name = scheduler.type === 'character'
      ? (gameData.characters.find(c => c.id === scheduler.targetId || String(c.id) === String(scheduler.targetId))?.variable || toVariable(scheduler.name || 'unknown'))
      : toVariable(scheduler.itemName || 'item');

    // Normalize to per-chapter format. Old projects stored flat keys like
    // "Mon_morning"; detect those and treat as chapter_1.
    const raw = scheduler.grid;
    const hasChapterKey = Object.keys(raw).some(k => k.startsWith('chapter_'));
    const perChapter = hasChapterKey ? raw : (Object.keys(raw).length > 0 ? { chapter_1: raw } : {});

    // Flatten to a single dict with keys like "chapter_1_Mon_morning".
    const flat = {};
    Object.entries(perChapter).forEach(([chKey, chGrid]) => {
      if (typeof chGrid !== 'object') return;
      Object.entries(chGrid).forEach(([dayPeriod, loc]) => {
        if (loc) flat[`${chKey}_${dayPeriod}`] = loc;
      });
    });

    lines.push(`default ${name}_schedule = ${JSON.stringify(flat)}`);
  });
  lines.push('');
  return lines.join('\n');
}

function generateProgressionCheck(gameData, chapterNum, allNodes, nextChapterNum) {
  const lines = [];
  lines.push(`label check_progression_${chapterNum}():`);

  // Chapter-end transitions play only as the chapter actually ends — emitted
  // inside the advancement branch below, NOT on every location visit.
  const chapterEndTrans = (allNodes || []).filter(n =>
    n.type === 'transition' &&
    n.data?.mode === 'trigger' &&
    n.data?.trigger === 'Chapter End'
  );
  const endTransLines = chapterEndTrans.map(t => `        call trans_${toVariable(t.data?.label || 'transition')}()`);

  if (nextChapterNum == null) {
    // Final chapter: nothing to advance to. (A jump here would point at a label
    // that doesn't exist — a Ren'Py "label not defined" error.)
    lines.push('    # Final chapter — no further progression.');
    lines.push('    return');
    lines.push('');
    return lines.join('\n');
  }

  if (gameData.progressionTrigger === 'points') {
    const threshold = gameData.pointsToAdvance || 10;
    const systems = gameData.progressionPointSystems || [];
    if (systems.length > 0) {
      const conditions = systems.map(sysId => {
        const sys = gameData.pointSystems.find(s => s.id === sysId);
        if (!sys) return null;
        const v = sys.variable || toVariable(sys.name);
        return `${v} >= ${threshold}`;
      }).filter(Boolean);
      if (conditions.length > 0) {
        lines.push(`    if ${conditions.join(' and ')}:`);
        endTransLines.forEach(l => lines.push(l));
        lines.push(`        $ current_chapter += 1`);
        lines.push(`        jump chapter_${nextChapterNum}_start`);
      }
    }
  } else if (gameData.progressionTrigger === 'time') {
    const daysPerGroup = gameData.daysPerGroup || 7;
    lines.push(`    if current_day >= ${daysPerGroup}:`);
    endTransLines.forEach(l => lines.push(l));
    lines.push(`        $ current_day = 0`);
    lines.push(`        $ current_chapter += 1`);
    lines.push(`        jump chapter_${nextChapterNum}_start`);
  }

  lines.push('    return');
  lines.push('');
  return lines.join('\n');
}

export function generateScript(nodes, edges, gameData) {
  const lines = [];
  const schedulers = gameData.schedulers || [];

  lines.push('# ============================================================');
  lines.push(`# ${gameData.projectName || 'My Game'}`);
  lines.push('# Generated by RPY Writer');
  lines.push('# ============================================================');
  lines.push('');

  lines.push(generateDefines(gameData));

  if (gameData.hudItems?.showInventory || gameData.hudItems?.showPoints || gameData.hudItems?.showDay || gameData.hudItems?.showPeriod) {
    lines.push(generateHUDScreen(gameData));
  }

  if (gameData.hudItems?.showInventory && gameData.items.length > 0) {
    lines.push(generateInventoryScreen(gameData));
  }

  if (gameData.timePeriods !== 'none') {
    lines.push(generateTimeAdvance(gameData));
    lines.push(generateEndDay(gameData, nodes));
  }

  lines.push(generateSchedulerInit(schedulers, gameData));

  // Generate all transition labels
  const transitionNodes = nodes.filter(n => n.type === 'transition');
  if (transitionNodes.length > 0) {
    lines.push('# ============================================================');
    lines.push('# TRANSITIONS');
    lines.push('# ============================================================');
    lines.push('');
    transitionNodes.forEach(n => lines.push(generateTransitionLabel(n)));
  }

  // Game start transitions
  const gameStartTrans = transitionNodes.filter(n =>
    n.data?.mode === 'trigger' && n.data?.trigger === 'Game Start'
  );

  lines.push('# ============================================================');
  lines.push('# GAME START');
  lines.push('# ============================================================');
  lines.push('');
  lines.push('label start:');
  lines.push('    show screen hud()');
  if (gameData.playerMode === 'custom') {
    const prompt = gameData.playerPrompt || 'What is your name?';
    lines.push(`    $ player_name = renpy.input("${prompt}", default="${gameData.playerDefault || 'Player'}")`);
    lines.push(`    $ player_name = player_name.strip() or "${gameData.playerDefault || 'Player'}"`);
  }
  gameStartTrans.forEach(t => {
    const transVar = toVariable(t.data?.label || 'transition');
    lines.push(`    call trans_${transVar}()`);
  });
  lines.push('    jump chapter_1_start');
  lines.push('');

  // Only Chapter-kind groups drive progression. Region groups are visual-only.
  const groupNodes = nodes.filter(n => n.type === 'group' && n.data?.kind !== 'region').sort((a, b) => (a.data.groupNumber || 0) - (b.data.groupNumber || 0));

  const isInsideGroup = (node, group) => {
    const gx = group.position.x, gy = group.position.y;
    const gw = group.style?.width || 400, gh = group.style?.height || 300;
    return node.position.x >= gx && node.position.x <= gx + gw &&
           node.position.y >= gy && node.position.y <= gy + gh;
  };

  // Locations not inside any CHAPTER group (including ones sitting only in a Region).
  const ungroupedLocationNodes = nodes.filter(n =>
    n.type === 'location' && !groupNodes.some(g => isInsideGroup(n, g))
  );

  if (groupNodes.length > 0) {
    groupNodes.forEach((group, idx) => {
      const chapterNum = group.data.groupNumber || idx + 1;
      const nextGroup = groupNodes[idx + 1];
      const nextChapterNum = nextGroup ? (nextGroup.data.groupNumber || idx + 2) : null;
      let locationNodes = nodes.filter(n => n.type === 'location' && isInsideGroup(n, group));
      // Unassigned locations have to live somewhere — fold them into the first chapter
      // so they aren't silently dropped from the script.
      if (idx === 0 && ungroupedLocationNodes.length > 0) {
        locationNodes = [...locationNodes, ...ungroupedLocationNodes];
      }
      lines.push(generateChapterLabel(chapterNum, locationNodes, gameData.locationData, edges, gameData, gameData.progressionLabel || 'Chapter', schedulers, nodes));
      lines.push(generateProgressionCheck(gameData, chapterNum, nodes, nextChapterNum));
    });
  } else if (ungroupedLocationNodes.length > 0) {
    lines.push(generateChapterLabel(1, ungroupedLocationNodes, gameData.locationData, edges, gameData, gameData.progressionLabel || 'Chapter', schedulers, nodes));
    // Single implicit chapter — emit its (terminal) progression check so the
    // call check_progression_1() inside each location has a valid target.
    lines.push(generateProgressionCheck(gameData, 1, nodes, null));
  }

  const sceneNodes = nodes.filter(n => n.type === 'scene');
  if (sceneNodes.length > 0) {
    lines.push('# ============================================================');
    lines.push('# SCENES');
    lines.push('# ============================================================');
    lines.push('');
    sceneNodes.forEach(node => lines.push(generateSceneLabel(node)));
  }

  const shopNodes = nodes.filter(n => n.type === 'shop');
  if (shopNodes.length > 0) {
    lines.push('# ============================================================');
    lines.push('# SHOP NODES');
    lines.push('# ============================================================');
    lines.push('');
    shopNodes.forEach(node => lines.push(generateShopLabel(node, gameData, nodes)));
  }

  // Game end transitions
  const gameEndTrans = transitionNodes.filter(n =>
    n.data?.mode === 'trigger' && n.data?.trigger === 'Game End'
  );
  if (gameEndTrans.length > 0) {
    lines.push('# ============================================================');
    lines.push('# GAME END');
    lines.push('# ============================================================');
    lines.push('');
    lines.push('label game_end():');
    gameEndTrans.forEach(t => {
      const transVar = toVariable(t.data?.label || 'transition');
      lines.push(`    call trans_${transVar}()`);
    });
    lines.push('    return');
    lines.push('');
  }

  return lines.join('\n');
}