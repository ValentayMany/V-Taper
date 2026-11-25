import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import { uid, today, dow, add, P } from '../services/db'
import { Badge } from '../components/Calendar'
import RestTimer from '../components/RestTimer'

const DN = ['วันจันทร์ (Monday)', 'วันอังคาร (Tuesday)', 'วันพุธ (Wednesday)', 'วันพฤหัสบดี (Thursday)', 'วันศุกร์ (Friday)', 'วันเสาร์ (Saturday)', 'วันอาทิตย์ (Sunday)']

const getHomeGuide = (name = '') => {
  const n = name.toLowerCase()
  if (n.includes('push-up board') || n.includes('green position') || (n.includes('push-up') && !n.includes('close'))) {
    return {
      badgeText: '🟢 ช่องสีเขียว (Chest)',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      badgeColor: '#34d399',
      title: 'บอร์ดวิดพื้น: ช่องสีเขียว (สร้างอกกว้าง)',
      tip: 'กางศอก 45 องศากับลำตัว (ไม่กาง 90 องศาเพื่อเซฟไหล่) เกร็งหน้าท้องลำตัวตรง',
      proTip: '💡 ทริคอกบน: นำขาวางบนเตียง/เก้าอี้ (Decline) น้ำหนักตัวจะลงยอดอกถึง 75% แน่นเหมือนยกเบนช์เพรสหนักๆ!'
    }
  }
  if (n.includes('close-grip') || n.includes('triceps push-up')) {
    return {
      badgeText: '🔵 ช่องชิดกลาง (Triceps)',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
      badgeColor: '#38bdf8',
      title: 'บอร์ดวิดพื้น: ช่องแคบ (เน้นหลังแขน + อกใน)',
      tip: 'เสียบด้ามจับช่องชิดกลาง ขนานลำตัว หนีบข้อศอกแนบชิดสีข้างขณะลดตัวลง',
      proTip: '💡 ทริคแขนแน่น: ที่จุดบนสุด ล็อคข้อศอกและเกร็งหลังแขนค้างไว้ 1 วินาทีเพื่อบีบเลือดเข้ากล้ามเนื้อ'
    }
  }
  if (n.includes('lateral raise')) {
    return {
      badgeText: '🔱 ไหล่กว้าง V-Taper (5kg ทรงพลัง)',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      badgeColor: '#fbbf24',
      title: 'ดัมเบล 5kg น้ำหนักทองคำของไหล่ข้าง',
      tip: 'โน้มตัวไปข้างหน้าเล็กน้อย ยกข้อศอกนำมือ ไม่ต้องยกสูงเกินระดับไหล่',
      proTip: '💡 เทคนิคกล้ามโต: ค้างที่จุดสูงสุด 1-2 วินาที แล้วลดแขนลงช้าๆ 3 วินาที (ห้ามใช้แรงเหวี่ยงตัว)'
    }
  }
  if (n.includes('floor press')) {
    return {
      badgeText: '🏋️‍♂️ อกหนา (Floor Press 5kg)',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      badgeColor: '#34d399',
      title: 'นอนดันดัมเบลบนพื้นห้อง ปลอดภัยต่อหัวไหล่',
      tip: 'นอนราบบนเสื่อ/พื้น ดันดัมเบลขึ้นตรงๆ บีบหน้าอกเข้าหากันที่จุดสูงสุด',
      proTip: '💡 เทคนิค 5kg: เมื่อศอกแตะพื้นให้หยุด 1 วินาที (Dead stop) แล้วระเบิดแรงดันขึ้น ห้ามเด้งศอกกับพื้น'
    }
  }
  if (n.includes('biceps curl') || (n.includes('biceps') && !n.includes('hammer'))) {
    return {
      badgeText: '💪 หน้าแขนลูกกลม (Biceps)',
      badgeBg: 'rgba(139, 92, 246, 0.15)',
      badgeColor: '#a78bfa',
      title: 'สร้างยอดลูกหนูให้กลมเด่น',
      tip: 'ล็อคข้อศอกให้อยู่ข้างลำตัวตลอดเวลา ไม่แกว่งข้อศอกไปข้างหน้า',
      proTip: '💡 เทคนิค 5kg: บิดข้อมือออกด้านนอก (Supination) ที่จุดสูงสุด พร้อมเกร็งหน้าแขนแน่นๆ 1 วินาที'
    }
  }
  if (n.includes('hammer')) {
    return {
      badgeText: '🔨 แขนหนาด้านข้าง (Brachialis)',
      badgeBg: 'rgba(139, 92, 246, 0.15)',
      badgeColor: '#a78bfa',
      title: 'สร้างความหนาของแขนเมื่อมองจากด้านหน้า',
      tip: 'หันฝ่ามือเข้าหากันเหมือนถือค้อน ล็อคศอกข้างลำตัว ยกขึ้นลงอย่างช้าๆ',
      proTip: '💡 ประโยชน์ต่อ V-Taper: กล้ามเนื้อ Brachialis จะดันกล้าม Biceps ให้ปูดขึ้น ทำให้แขนดูใหญ่และเต็มขึ้น'
    }
  }
  if (n.includes('overhead triceps') || n.includes('skull crusher')) {
    return {
      badgeText: '⚡ หลังแขนรูปเกือกม้า (Triceps)',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
      badgeColor: '#38bdf8',
      title: 'หลังแขนมีขนาดถึง 65% ของท่อนแขนทั้งหมด',
      tip: 'ถือดัมเบลสองมือเหนือศีรษะ (หรือข้างละ 5kg) ล็อคศอกชี้ขึ้นเพดาน ค่อยๆ พับศอกลงหลังศีรษะ',
      proTip: '💡 เทคนิค 5kg: ดันขึ้นจนสุดแขนเพื่อบีบ Long Head ของหลังแขนให้ทำงานเต็มพิกัด'
    }
  }
  if (n.includes('shoulder press')) {
    return {
      badgeText: '🛡️ หัวไหล่มวลรวม (Delts)',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      badgeColor: '#fbbf24',
      title: 'สร้างมวลไหล่รอบทิศทาง',
      tip: 'กดก้นแน่น ดันดัมเบลขึ้นเหนือหัวเป็นวิถีโค้งเล็กน้อย ไม่แอ่นหลังส่วนล่าง',
      proTip: '💡 เทคนิค 5kg: ลดดัมเบลลงช้าๆ ให้ถึงระดับใบหู แล้วดันขึ้นโดยไม่กระชาก'
    }
  }
  if (n.includes('one-arm') || n.includes('dumbbell row')) {
    return {
      badgeText: '🦅 ปีกกว้าง V-Taper (Lats)',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      badgeColor: '#34d399',
      title: 'ดึงปีกให้กว้างเพื่อรับกับเอวที่คอด',
      tip: 'วางเข่าข้างหนึ่งบนเก้าอี้/เตียง โน้มตัวขนานพื้น ดึงดัมเบลเข้าหาเอว (ไม่ใช่ดึงขึ้นหาอก)',
      proTip: '💡 ทริคปีก V-Taper: จังหวะดึง ให้จินตนาการว่ากำลังเอาข้อศอกแทงไปข้างหลัง แล้วบีบปีก 1 วินาที'
    }
  }
  if (n.includes('pullover')) {
    return {
      badgeText: '🫁 ขยายกรงอก & ยืดปีก (Pullover)',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      badgeColor: '#34d399',
      title: 'ท่ายืดอกและกล้ามเนื้อ Serratus ด้านข้าง',
      tip: 'นอนหงาย ถือดัมเบล 5kg สองมือเหนืออก ค่อยๆ หย่อนดัมเบลข้ามศีรษะลงช้าๆ',
      proTip: '💡 สัมผัส: รู้สึกถึงการยืดเหยียดของกรงอกและปีก หายใจเข้าลึกๆ จังหวะลดลง'
    }
  }
  return null
}

const isBodyweightExercise = (name = '') => {
  const n = name.toLowerCase()
  return n.includes('push-up') || n.includes('pushup') || n.includes('plank') || n.includes('bodyweight') || n.includes('dip') || n.includes('pull-up') || n.includes('chin-up')
}

const isTimedExercise = (ex) => {
  if (ex?.timed) return true
  const n = (ex?.name || '').toLowerCase()
  return n.includes('plank')
}

const isPerSideExercise = (ex) => {
  if (ex?.perSide) return true
  const n = (ex?.name || '').toLowerCase()
  return n.includes('one-arm') || n.includes('reverse lunge') || n.includes('side plank')
}

const parseRepRange = (repRange, fallback = 12) => {
  if (repRange) {
    const nums = String(repRange).match(/\d+/g)
    if (nums && nums.length >= 2) return { min: +nums[0], max: +nums[1] }
    if (nums && nums.length === 1) return { min: +nums[0], max: +nums[0] }
  }
  const n = Number(fallback) || 12
  return { min: Math.max(1, n - 4), max: n }
}

const getDefaultKg = (name = '') => isBodyweightExercise(name) ? '0' : '5'

export default function Daily() {
  const { date: paramDate } = useParams()
  const navigate = useNavigate()
  const { S, update, toast } = useStore()

  const [viewDate, setViewDate] = useState(paramDate || today())
  const d = paramDate || viewDate

  const [selectedExId, setSelectedExId] = useState('')
  const [activeTimerSeconds, setActiveTimerSeconds] = useState(null)
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(dow(d))
  const [wakeLockActive, setWakeLockActive] = useState(false)

  const exById = (id) => S.exercises.find(e => e.id === id)
  const sess = S.sessions.find(s => s.date === d)
  const y = S.plan.days[dow(d)]

  const targetPlanIndex = (selectedPlanIdx !== null && selectedPlanIdx >= 0 && selectedPlanIdx < 7)
    ? selectedPlanIdx
    : dow(d)
  const displayPlan = S.plan.days[targetPlanIndex] || y
  const isSubstituted = targetPlanIndex !== dow(d)

  useEffect(() => {
    setSelectedPlanIdx(dow(d))
  }, [d])

  // Screen Wake Lock during workout so screen doesn't turn off
  useEffect(() => {
    let sentinel = null
    let isMounted = true

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          sentinel = await navigator.wakeLock.request('screen')
          if (isMounted) setWakeLockActive(true)
          sentinel.addEventListener('release', () => {
            if (isMounted) setWakeLockActive(false)
          })
        }
      } catch (e) {
        console.log('Wake Lock info:', e)
      }
    }

    if (sess && sess.status === 'in_progress') {
      requestWakeLock()
    } else {
      if (sentinel) sentinel.release().catch(() => {})
      setWakeLockActive(false)
    }

    return () => {
      isMounted = false
      if (sentinel) sentinel.release().catch(() => {})
    }
  }, [sess?.status])

  const getPrevExerciseRecord = (exId, exName) => {
    const pastSessions = S.sessions
      .filter(s => s.date < d && s.status !== 'rest')
      .sort((a, b) => (a.date < b.date ? 1 : -1))

    for (const session of pastSessions) {
      const matchEx = session.exercises?.find(
        x => (x.exId && x.exId === exId) || (exName && x.name?.trim().toLowerCase() === exName.trim().toLowerCase())
      )
      if (matchEx && matchEx.sets && matchEx.sets.length > 0) {
        const validSets = matchEx.sets.filter(st => +st.reps > 0)
        if (validSets.length > 0) {
          const bestReps = Math.max(...validSets.map(st => +st.reps))
          const bestKg = Math.max(...validSets.map(st => +st.kg || 0))
          const summary = validSets
            .map(st => `${st.reps} ครั้ง${st.kg ? ` @${st.kg}kg` : ''}`)
            .join(', ')

          return {
            date: session.date,
            sets: validSets,
            bestReps,
            bestKg,
            summary,
            targetReps: bestReps + 1,
          }
        }
      }
    }
    return null
  }

  // Check if yesterday was a planned workout day that wasn't completed
  const yesterdayDate = add(d, -1)
  const yesterdayDow = dow(yesterdayDate)
  const yesterdayPlan = S.plan.days[yesterdayDow]
  const yesterdaySess = S.sessions.find(s => s.date === yesterdayDate)
  const missedYesterday = yesterdayPlan && !yesterdayPlan.rest && (!yesterdaySess || yesterdaySess.status !== 'completed')

  const getNextWorkoutRecommendation = (exercise, prevRecord) => {
    const validSets = exercise.sets.filter(s => +s.reps > 0)
    const targetSets = exercise.targetSets || 3
    const { min: targetMin, max: targetMax } = parseRepRange(exercise.repRange, exercise.targetReps)
    const unit = isTimedExercise(exercise) ? 'วิ' : 'ครั้ง'
    const sideLabel = isPerSideExercise(exercise) ? '/ข้าง' : ''

    const computeNextTargets = (setsArr) => {
      // Pad or trim to targetSets
      const repsList = Array.from({ length: targetSets }, (_, idx) => {
        const s = setsArr[idx]
        return s ? (+s.reps || 0) : 0
      })
      const incomplete = setsArr.length < targetSets || repsList.some(r => r === 0)
      if (incomplete) {
        // Do not increase reps if previous session was incomplete
        return repsList.map(r => (r > 0 ? r : targetMin))
      }
      const allAtMax = repsList.every(r => r >= targetMax)
      if (allAtMax) {
        // Safe cap: stay at max or +1-2 with controlled tempo (respecting 5kg equipment)
        return repsList.map(() => targetMax)
      }
      // Bring lagging sets up first toward the highest completed set (up to targetMax)
      const highest = Math.min(targetMax, Math.max(...repsList))
      return repsList.map(r => (r < highest ? Math.min(targetMax, r + 2, highest) : Math.min(targetMax, r + 1)))
    }

    if (validSets.length === 0) {
      if (prevRecord) {
        const prevList = prevRecord.sets.map(s => +s.reps)
        const nextList = computeNextTargets(prevRecord.sets)
        const prevIncomplete = prevList.length < targetSets
        return {
          icon: prevIncomplete ? '📋' : '🎯',
          badge: prevIncomplete ? 'ทำเซ็ตให้ครบ' : 'เป้าวันนี้',
          badgeBg: prevIncomplete ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)',
          badgeColor: prevIncomplete ? '#fbbf24' : '#38bdf8',
          shortText: `ครั้งก่อน: ${prevList.join(' / ')} ${unit}${sideLabel} → เป้าวันนี้: ${nextList.join(' / ')} ${unit}${sideLabel}`
        }
      }
      return {
        icon: '🌱',
        badge: 'ครั้งแรก',
        badgeBg: 'rgba(16, 185, 129, 0.15)',
        badgeColor: '#34d399',
        shortText: `ตั้งเป้า ${targetSets} เซ็ต × ${exercise.repRange || `${targetMin}–${targetMax} ${unit}${sideLabel}`} · พัก ${exercise.rest}วิ`
      }
    }

    const bestReps = Math.max(...validSets.map(s => +s.reps))
    const allMetMax = validSets.length >= targetSets && validSets.every(s => +s.reps >= targetMax)
    const allMetMin = validSets.length >= targetSets && validSets.every(s => +s.reps >= targetMin)

    if (prevRecord && prevRecord.bestReps > 0 && bestReps < prevRecord.bestReps && validSets.length >= 2) {
      return {
        icon: '🛌',
        badge: 'เน้นฟื้นฟู',
        badgeBg: 'rgba(245, 158, 11, 0.15)',
        badgeColor: '#fbbf24',
        shortText: `ลดลงจากครั้งก่อน (${bestReps} vs ${prevRecord.bestReps} ${unit}) — คงน้ำหนักเดิม เน้นฟอร์มและพักผ่อน`
      }
    }

    if (allMetMax) {
      return {
        icon: '🔥',
        badge: 'พร้อมพัฒนา',
        badgeBg: 'rgba(16, 185, 129, 0.18)',
        badgeColor: '#34d399',
        shortText: `ครบเป้าสูงสุด (${targetMax} ${unit}) ทุกเซ็ต! ครั้งหน้าค้างจังหวะ 2 วิ หรือลดเวลาพักลง`
      }
    }

    const nextList = computeNextTargets(validSets)
    return {
      icon: '📈',
      badge: allMetMin ? 'สะสมแรงต่อ' : 'เก็บให้ครบเซ็ต',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
      badgeColor: '#38bdf8',
      shortText: `วันนี้: ${validSets.map(s => s.reps).join(' / ')} → ครั้งหน้าตั้งเป้า: ${nextList.join(' / ')} ${unit}${sideLabel}`
    }
  }

  const dstat = () => {
    if (sess) {
      if (sess.status === 'rest') {
        return !y.rest ? 'swapped_rest' : 'rest'
      }
      return sess.status === 'in_progress' ? 'partial' : sess.status
    }
    if (y.rest) return d <= today() ? 'rest' : 'planned-rest'
    return d < today() && d >= S.settings.start ? 'skipped' : 'planned'
  }

  const setsDone = (s) => s.exercises.reduce((n, e) => n + e.sets.filter(x => +x.reps > 0).length, 0)

  const goDate = (n) => navigate(`/daily/${add(d, n)}`)

  const startWorkout = () => {
    const sessionDayName = isSubstituted
      ? `${displayPlan.name} (ชดเชย)`
      : displayPlan.name

    update(s => {
      s.sessions = s.sessions.filter(x => x.date !== d)
      s.sessions.push({
        id: uid(),
        date: d,
        dayName: sessionDayName,
        status: 'in_progress',
        note: isSubstituted ? `ฝึกชดเชยโปรแกรม ${displayPlan.name} (${DN[targetPlanIndex].split(' ')[0]})` : '',
        startedAt: Date.now(),
        exercises: displayPlan.rest ? [] : displayPlan.items.map(item => {
          const e = exById(item.exId) || { name: '?', muscle: '-' }
          const defKg = getDefaultKg(e.name)
          return {
            exId: item.exId,
            name: e.name,
            muscle: e.muscle,
            equip: e.equip || '-',
            targetSets: item.sets,
            targetReps: item.reps,
            repRange: item.repRange || e.repRange || '',
            perSide: !!(item.perSide || e.perSide),
            timed: !!(item.timed || e.timed),
            rest: item.rest,
            done: false,
            note: '',
            sets: [{ reps: '', kg: defKg, rest: item.rest, rpe: '', done: false }],
          }
        }),
      })
    })
  }

  const markAsRestDay = () => {
    update(s => {
      s.sessions = s.sessions.filter(x => x.date !== d)
      s.sessions.push({
        id: uid(),
        date: d,
        dayName: 'วันพัก (สลับพัก)',
        status: 'rest',
        note: 'สลับเป็นวันพักผ่อน (จะไปฝึกชดเชยวันอื่น)',
        startedAt: Date.now(),
        exercises: [],
      })
    })
    toast('บันทึกวันนี้เป็น "วันพัก" เรียบร้อยแล้ว 🛌')
  }

  const unmarkRestDay = () => {
    update(s => {
      s.sessions = s.sessions.filter(x => x.date !== d)
    })
    toast('ยกเลิกวันพักแล้ว กลับสู่ตารางปกติ')
  }

  const loadPlanIntoCurrentSession = (planIndex) => {
    const target = S.plan.days[planIndex]
    if (!target || target.rest) return
    update(s => {
      const cur = s.sessions.find(x => x.date === d)
      if (!cur) return
      cur.dayName = `${target.name} (ชดเชย)`
      cur.note = cur.note ? `${cur.note} | ดึงท่าจาก ${target.name}` : `ดึงท่าจากโปรแกรม ${target.name}`
      cur.exercises = target.items.map(item => {
        const e = exById(item.exId) || { name: '?', muscle: '-' }
        const defKg = getDefaultKg(e.name)
        return {
          exId: item.exId,
          name: e.name,
          muscle: e.muscle,
          equip: e.equip || '-',
          targetSets: item.sets,
          targetReps: item.reps,
          repRange: item.repRange || e.repRange || '',
          perSide: !!(item.perSide || e.perSide),
          timed: !!(item.timed || e.timed),
          rest: item.rest,
          done: false,
          note: '',
          sets: [{ reps: '', kg: defKg, rest: item.rest, rpe: '', done: false }],
        }
      })
    })
    toast(`ดึงท่าจากโปรแกรม ${target.name} เรียบร้อยแล้ว`)
  }

  const handleSetField = (i, j, field, val) => {
    const R = { reps: [0, 999], repsLeft: [0, 999], repsRight: [0, 999], kg: [0, 500], rest: [0, 1800], rpe: [1, 10] }[field]
    if (val !== '' && !(+val >= R[0] && +val <= R[1])) {
      toast(`${field} ต้องอยู่ระหว่าง ${R[0]}–${R[1]}`, true); return
    }
    update(s => {
      const ss = s.sessions.find(x => x.date === d)
      const st = ss.exercises[i].sets[j]
      st[field] = val
      if (field === 'repsLeft' || field === 'repsRight') {
        const l = st.repsLeft !== '' && st.repsLeft != null ? +st.repsLeft : null
        const r = st.repsRight !== '' && st.repsRight != null ? +st.repsRight : null
        if (l !== null && r !== null) st.reps = String(Math.min(l, r))
        else if (l !== null) st.reps = String(l)
        else if (r !== null) st.reps = String(r)
        else st.reps = ''
      }
    }, true)
  }

  const addSet = (i) => {
    update(s => {
      const ss = s.sessions.find(x => x.date === d)
      const e = ss.exercises[i]
      const prev = e.sets[e.sets.length - 1]
      e.sets.push({ reps: '', kg: prev ? prev.kg : getDefaultKg(e.name), rest: e.rest, rpe: '', done: false })
    }, true)
  }

  const handleToggleSetDone = (i, j) => {
    update(s => {
      const ss = s.sessions.find(x => x.date === d)
      const ex = ss.exercises[i]
      const st = ex.sets[j]
      const newDone = !st.done
      st.done = newDone

      // Auto-trigger rest timer if completed and has reps
      if (newDone && +st.reps > 0) {
        setActiveTimerSeconds(st.rest || ex.rest || 60)
      }

      // If all sets in this exercise are marked done, mark the exercise done
      if (ex.sets.length > 0 && ex.sets.every(x => x.done)) {
        ex.done = true
      }
    }, true)
  }

  const deleteSet = (i, j) => {
    update(s => {
      s.sessions.find(x => x.date === d).exercises[i].sets.splice(j, 1)
    }, true)
  }

  const completeExercise = (i) => {
    update(s => {
      const e = s.sessions.find(x => x.date === d).exercises[i]
      if (!e.done && !e.sets.some(x => +x.reps > 0)) {
        toast('กรอกจำนวนครั้งอย่างน้อย 1 เซ็ตก่อน', true)
        return
      }
      e.done = !e.done
    }, true)
  }

  const removeExercise = (i) => {
    if (!confirm('ลบท่านี้ออกจากการฝึกวันนี้?')) return
    update(s => {
      s.sessions.find(x => x.date === d).exercises.splice(i, 1)
    })
  }

  const addExerciseToSession = (e) => {
    if (e) e.preventDefault()
    const targetId = selectedExId || (S.exercises[0]?.id)
    if (!targetId) return
    const targetEx = exById(targetId)
    if (!targetEx) return
    update(s => {
      const currentSession = s.sessions.find(x => x.date === d)
      if (!currentSession) return
      const defKg = getDefaultKg(targetEx.name)
      currentSession.exercises.push({
        exId: targetEx.id,
        name: targetEx.name,
        muscle: targetEx.muscle,
        equip: targetEx.equip || '-',
        targetSets: targetEx.sets,
        targetReps: targetEx.reps,
        repRange: targetEx.repRange || '',
        perSide: !!targetEx.perSide,
        timed: !!targetEx.timed,
        rest: targetEx.rest,
        done: false,
        note: '',
        sets: [{ reps: '', kg: defKg, rest: targetEx.rest, rpe: '', done: false }],
      })
    }, true)
  }

  const handleExNote = (i, val) => {
    update(s => { s.sessions.find(x => x.date === d).exercises[i].note = val }, true)
  }

  const handleSessionNote = (val) => {
    update(s => { s.sessions.find(x => x.date === d).note = val }, true)
  }

  const saveProgress = () => {
    update(s => {}, false) // just trigger persist with toast
  }

  const completeWorkout = () => {
    if (!setsDone(sess)) { toast('ยังไม่มีผลการฝึกที่บันทึก', true); return }
    const doIt = () => update(s => {
      const ss = s.sessions.find(x => x.date === d)
      ss.status = 'completed'
      ss.exercises.forEach(e => {
        if (e.sets.some(x => +x.reps > 0)) {
          e.done = true
          e.sets.forEach(st => {
            if (+st.reps > 0) st.done = true
          })
        }
      })
    })
    if (sess.exercises.some(e => !e.done)) {
      if (confirm('ยังมีท่าที่ไม่ได้กด Complete — ยืนยันว่าฝึกเสร็จแล้ว?')) doIt()
    } else doIt()
  }

  const reopenWorkout = () => {
    update(s => { s.sessions.find(x => x.date === d).status = 'in_progress' })
  }

  const deleteSession = () => {
    if (!confirm('ลบบันทึกการฝึกของวันนี้?')) return
    update(s => { s.sessions = s.sessions.filter(x => x.date !== d) })
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1>🏋️‍♂️ Daily Workout</h1>
        <p className="mut" style={{ margin: 0, fontSize: 14 }}>
          บันทึกน้ำหนัก จำนวนครั้ง และความเข้มข้นของการฝึก
        </p>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div className="sp" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div className="row" style={{ margin: 0 }}>
            <button className="b s" onClick={() => goDate(-1)}>‹ วันก่อน</button>
            <input
              type="date"
              value={d}
              onChange={e => navigate(`/daily/${e.target.value}`)}
              style={{ fontWeight: 600 }}
            />
            <button className="b s" onClick={() => goDate(1)}>วันถัดไป ›</button>
          </div>
          <button className="b s" onClick={() => navigate(`/daily/${today()}`)}>
            📅 ไปที่วันนี้
          </button>
        </div>
      </div>

      <div className="card sp" style={{ borderLeft: '4px solid var(--g)' }}>
        <div>
          <span className="mut" style={{ fontSize: 13, display: 'block' }}>{DN[dow(d)]}</span>
          <b style={{ fontSize: 18 }}>{y.name}</b>
        </div>
        <Badge status={dstat()} />
      </div>

      {sess && sess.status === 'rest' ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px', borderLeft: '4px solid var(--b)' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🛌</div>
          <b style={{ fontSize: 20, color: 'var(--b)', display: 'block' }}>
            {sess.dayName || 'วันพักผ่อน (สลับเป็นวันพัก)'}
          </b>
          <p className="mut" style={{ margin: '8px 0 24px', fontSize: 14 }}>
            {sess.note || 'คุณได้กำหนดให้วันนี้เป็นวันพักผ่อน เพื่อไปออกกำลังกายชดเชยในวันอื่น'}
          </p>
          <div className="row" style={{ justifyContent: 'center', gap: 12, margin: 0, flexWrap: 'wrap' }}>
            <button className="b s" onClick={unmarkRestDay} style={{ padding: '9px 18px', fontSize: 14 }}>
              ↩ ยกเลิกวันพัก (กลับสู่ตารางปกติ)
            </button>
            <button className="b p" onClick={startWorkout} style={{ padding: '9px 18px', fontSize: 14 }}>
              ⚡ เปลี่ยนใจ อยากเริ่มฝึกวันนี้
            </button>
          </div>
        </div>
      ) : !sess ? (
        <div className="card">
          {/* Suggestion banner if yesterday was missed & today is rest day */}
          {y.rest && missedYesterday && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 78, 59, 0.25))',
              border: '1px solid var(--g)',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--g)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>💡</span> เล่นชดเชย: เมื่อวาน ({DN[yesterdayDow].split(' ')[0]}) คุณยังไม่ได้ฝึก
                </div>
                <div className="mut" style={{ fontSize: 13, marginTop: 4 }}>
                  วันนี้เป็นวันพักตามแผน ต้องการนำโปรแกรม <b>"{yesterdayPlan.name}"</b> มาฝึกทดแทนวันนี้ไหม?
                </div>
              </div>
              <button
                className="b p"
                style={{ fontSize: 13, padding: '8px 14px' }}
                onClick={() => setSelectedPlanIdx(yesterdayDow)}
              >
                ⚡ ดึงโปรแกรม {yesterdayPlan.name} มาเล่นวันนี้
              </button>
            </div>
          )}

          {/* Program Selector */}
          <div style={{
            background: 'var(--c2)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--ln)',
            marginBottom: 16
          }}>
            <div className="sp" style={{ marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🔄</span> {y.rest ? 'วันนี้เป็นวันพัก — เลือกโปรแกรมมาฝึกทดแทน:' : 'เลือกโปรแกรมที่จะฝึกวันนี้:'}
              </label>
              {isSubstituted && (
                <button
                  className="b s"
                  style={{ fontSize: 11, padding: '3px 8px' }}
                  onClick={() => setSelectedPlanIdx(dow(d))}
                >
                  ↺ กลับไปตามตาราง ({DN[dow(d)].split(' ')[0]})
                </button>
              )}
            </div>

            <select
              value={targetPlanIndex}
              onChange={e => setSelectedPlanIdx(Number(e.target.value))}
              style={{ width: '100%', fontWeight: 600, padding: '8px 12px' }}
            >
              <option value={dow(d)}>
                ⭐ โปรแกรมตามตารางประจำวัน ({DN[dow(d)].split(' ')[0]}: {y.name}{y.rest ? ' - วันพัก' : ''})
              </option>
              <optgroup label="🔁 สลับนำโปรแกรมของวันอื่นมาเล่นชดเชย:">
                {S.plan.days.map((p, idx) => {
                  if (idx === dow(d)) return null
                  return (
                    <option key={idx} value={idx}>
                      {DN[idx].split(' ')[0]} — {p.name} {p.rest ? '(วันพัก)' : `(${p.items?.length || 0} ท่า)`}
                    </option>
                  )
                })}
              </optgroup>
            </select>
          </div>

          <h3 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📋</span> รายการท่าที่จะฝึก ({displayPlan.name})
            {isSubstituted && <span className="bd" style={{ background: 'var(--g)', color: '#fff', fontSize: 11 }}>เล่นชดเชย</span>}
          </h3>

          {displayPlan.rest ? (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🛌</div>
              <b style={{ fontSize: 16 }}>{displayPlan.name}</b>
              <p className="mut" style={{ margin: '6px 0 0', fontSize: 13 }}>
                ไม่มีโปรแกรมการฝึกที่ต้องทำในวันนี้ — หากต้องการฝึกทดแทน สามารถเลือกโปรแกรมของวันอื่นจากเมนูด้านบนได้เลย
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {displayPlan.items.map((item, i) => {
                const ex = exById(item.exId)
                const prev = ex ? getPrevExerciseRecord(ex.id, ex.name) : null
                const timed = !!(item.timed || ex?.timed || isTimedExercise(ex))
                const perSide = !!(item.perSide || ex?.perSide || isPerSideExercise(ex))
                const targetLabel = item.repRange || `${item.reps} ${timed ? 'วิ' : 'ครั้ง'}${perSide ? '/ข้าง' : ''}`
                return (
                  <div key={i} className="ex-row" style={{ flexWrap: 'wrap', gap: 6 }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{ex?.name || '?'}</span>
                      <span className="mut" style={{ fontSize: 12, marginLeft: 8 }}>
                        ({ex?.muscle || '-'})
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {prev && (
                        <span style={{ fontSize: 11, color: 'var(--b)', background: 'var(--b-bg)', padding: '2px 8px', borderRadius: 99 }}>
                          📜 ล่าสุด: {prev.bestReps} {timed ? 'วิ' : 'ครั้ง'}
                        </span>
                      )}
                      <span className="bd planned" style={{ fontSize: 12 }}>
                        {item.sets} เซ็ต × {targetLabel} · พัก {item.rest}s
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <div className="row" style={{ marginTop: 16, gap: 10, flexWrap: 'wrap' }}>
            <button className="b p" style={{ flex: 1, minWidth: 200, padding: '12px', fontSize: 15 }} onClick={startWorkout}>
              {isSubstituted
                ? `⚡ เริ่มการฝึกชดเชย: ${displayPlan.name}`
                : (displayPlan.rest ? '⚡ เริ่มการฝึกนอกตาราง (ไม่มีท่าตั้งต้น)' : `🚀 เริ่มการฝึก: ${displayPlan.name}`)}
            </button>
            {!displayPlan.rest && (
              <button
                className="b"
                style={{
                  background: 'var(--b-bg)',
                  color: 'var(--b)',
                  borderColor: 'rgba(56, 189, 248, 0.3)',
                  padding: '12px 18px',
                  fontSize: 14,
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
                onClick={markAsRestDay}
                title="สลับวันนี้เป็นวันพักผ่อน เพื่อไปฝึกชดเชยวันอื่น"
              >
                🛌 วันนี้ขอพัก (สลับวันพัก)
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {sess.exercises.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '28px 16px', background: 'var(--c2)', border: '1px dashed var(--g2)' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
              <b style={{ fontSize: 16 }}>ยังไม่มีท่าฝึกในเซสชันนี้</b>
              <p className="mut" style={{ fontSize: 13, margin: '6px 0 16px' }}>
                วันนี้เริ่มการฝึกจากวันพัก คุณสามารถเลือกดึงท่าฝึกจากโปรแกรมประจำวันเข้ามาฝึกได้ทันที:
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 450, margin: '0 auto' }}>
                <select id="importEmptyPlan" style={{ flex: 1, minWidth: 200, padding: '8px 12px' }}>
                  {S.plan.days.map((p, idx) => !p.rest && (
                    <option key={idx} value={idx}>{DN[idx].split(' ')[0]} — {p.name}</option>
                  ))}
                </select>
                <button
                  className="b p"
                  onClick={() => {
                    const sel = document.getElementById('importEmptyPlan')
                    if (sel) loadPlanIntoCurrentSession(Number(sel.value))
                  }}
                >
                  📥 ดึงท่าฝึกทันที
                </button>
              </div>
            </div>
          )}

          <div className="card" style={{ padding: '10px 14px', background: 'var(--c2)' }}>
            <div className="sp" style={{ flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>⏱️ จับเวลาพักด่วน:</span>
                {wakeLockActive && (
                  <span style={{
                    fontSize: 11,
                    color: 'var(--g-bright)',
                    background: 'var(--g-bg)',
                    padding: '2px 8px',
                    borderRadius: 99,
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <span>📱</span> จอเปิดค้างไว้
                  </span>
                )}
              </div>
              <div className="row" style={{ margin: 0, gap: 6 }}>
                {[30, 45, 60, 90, 120].map(sec => (
                  <button key={sec} className="b s" onClick={() => setActiveTimerSeconds(sec)}>
                    {sec}วิ
                  </button>
                ))}
              </div>
            </div>
          </div>

          {sess.exercises.map((e, i) => {
            const prevRecord = getPrevExerciseRecord(e.exId, e.name)
            const homeGuide = getHomeGuide(e.name)
            const nextRec = getNextWorkoutRecommendation(e, prevRecord)
            const isBW = isBodyweightExercise(e.name)
            const isTimed = isTimedExercise(e)
            const isPerSide = isPerSideExercise(e)
            const unitLabel = isTimed ? 'วินาที' : 'ครั้ง'
            const targetDisplay = e.repRange || `${e.targetReps} ${isTimed ? 'วิ' : 'ครั้ง'}${isPerSide ? '/ข้าง' : ''}`
            const doneSetsCount = e.sets.filter(s => s.done || +s.reps > 0).length
            const targetSetsCount = e.targetSets || e.sets.length || 3
            const progressPercent = Math.min(100, Math.round((doneSetsCount / targetSetsCount) * 100))

            return (
              <div key={i} className={`card ${e.done ? 'dn' : ''}`} style={{ borderColor: e.done ? 'var(--g2)' : undefined }}>
                {/* Exercise Header */}
                <div style={{ borderBottom: '1px solid var(--ln)', paddingBottom: 10, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <b style={{ fontSize: 16 }}>{e.name}</b>
                        <span className="bd" style={{ background: 'var(--c2)', fontSize: 10.5 }}>{e.muscle}</span>
                        {isBW && (
                          <span className="bd" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: 10.5 }}>BW</span>
                        )}
                        {isPerSide && (
                          <span className="bd" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: 10.5 }}>ซ้าย/ขวา</span>
                        )}
                        {isTimed && (
                          <span className="bd" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: 10.5 }}>จับเวลา</span>
                        )}
                      </div>
                      <div className="mut" style={{ fontSize: 12.5, marginTop: 3 }}>
                        {e.targetSets} เซ็ต × {targetDisplay} · พัก {e.rest}วิ
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <button className="b s" onClick={() => setActiveTimerSeconds(e.rest || 60)} style={{ padding: '6px 10px', fontSize: 12 }}>
                        ⏱ {e.rest || 60}s
                      </button>
                      {e.done && <span className="bd completed" style={{ fontSize: 11 }}>✓</span>}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <div style={{ flex: 1, height: 6, background: 'var(--c2)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${progressPercent}%`, height: '100%', background: doneSetsCount >= targetSetsCount ? 'var(--g)' : 'var(--b)', borderRadius: 99, transition: 'width 0.3s ease' }} />
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: doneSetsCount >= targetSetsCount ? 'var(--g-bright)' : 'var(--b)', whiteSpace: 'nowrap' }}>
                      {doneSetsCount}/{targetSetsCount} เซ็ต
                    </span>
                  </div>
                </div>

                {/* Previous Record - Single Line Compact */}
                {prevRecord && (
                  <div style={{
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 10px',
                    marginBottom: 10,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 6
                  }}>
                    <span style={{ color: 'var(--b)' }}>
                      📜 ล่าสุด: <b>{prevRecord.sets.map(st => st.reps).join(', ')}</b>
                    </span>
                    <span style={{ color: 'var(--g-bright)', fontWeight: 700 }}>
                      🔥 เป้า: {prevRecord.targetReps}+
                    </span>
                  </div>
                )}

                {/* Home Workout Guide (collapsed) */}
                {homeGuide && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.06)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '7px 10px',
                    marginBottom: 10,
                    fontSize: 11.5
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        background: homeGuide.badgeBg,
                        color: homeGuide.badgeColor,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 99,
                        fontSize: 10.5
                      }}>
                        {homeGuide.badgeText}
                      </span>
                      <span style={{ color: 'var(--mt)', fontSize: 11.5 }}>{homeGuide.tip}</span>
                    </div>
                  </div>
                )}

                {/* Set Cards - Mobile Friendly */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                  {e.sets.map((set, j) => {
                    const prevSet = prevRecord?.sets[j]
                    return (
                      <div key={j} className="set-card" style={{
                        background: set.done ? 'rgba(16, 185, 129, 0.1)' : 'var(--c2)',
                        border: set.done ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--ln)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 12px',
                        transition: 'all 0.2s ease'
                      }}>
                        {/* Set Header Row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              background: set.done ? 'var(--g)' : 'rgba(16, 185, 129, 0.15)',
                              color: set.done ? '#032011' : 'var(--g-bright)',
                              fontWeight: 800,
                              fontSize: 12,
                              width: 28,
                              height: 28,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 99
                            }}>
                              {set.done ? '✓' : j + 1}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--mt)' }}>
                              เป้า: <b style={{ color: 'var(--tx)' }}>{targetDisplay}</b>
                            </span>
                            {prevRecord && set.reps && +set.reps > prevRecord.bestReps && (
                              <span style={{
                                fontSize: 10.5,
                                color: '#fbbf24',
                                fontWeight: 800,
                                background: 'rgba(245, 158, 11, 0.18)',
                                border: '1px solid rgba(245, 158, 11, 0.4)',
                                borderRadius: 4,
                                padding: '1px 6px'
                              }}>
                                🏆 PR! (+{+set.reps - prevRecord.bestReps})
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button
                              type="button"
                              onClick={() => handleToggleSetDone(i, j)}
                              style={{
                                padding: '5px 10px',
                                fontSize: 12,
                                fontWeight: 700,
                                borderRadius: 'var(--radius-sm)',
                                border: set.done ? 'none' : '1px solid var(--ln)',
                                background: set.done ? 'var(--g)' : 'rgba(255, 255, 255, 0.05)',
                                color: set.done ? '#032011' : 'var(--mt)',
                                cursor: 'pointer',
                                minHeight: 30
                              }}
                            >
                              {set.done ? '✓ เสร็จ' : '○ บันทึก'}
                            </button>
                            <button className="b s d" onClick={() => deleteSet(i, j)} style={{ padding: '5px 8px', fontSize: 12, minHeight: 30 }}>✕</button>
                          </div>
                        </div>

                        {/* Input Grid — 4 cols on desktop, 2x2 on mobile */}
                        <div className="set-input-grid">
                          {isPerSide ? (
                            <div>
                              <label style={{ fontSize: 10.5, color: 'var(--mt)', fontWeight: 600, display: 'block', marginBottom: 3 }}>
                                ซ้าย / ขวา ({unitLabel})
                              </label>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                                <input
                                  className="n" type="number" step="1"
                                  value={set.repsLeft ?? set.reps ?? ''}
                                  placeholder="ซ้าย"
                                  onChange={ev => handleSetField(i, j, 'repsLeft', ev.target.value)}
                                  style={{ width: '100%' }}
                                />
                                <input
                                  className="n" type="number" step="1"
                                  value={set.repsRight ?? set.reps ?? ''}
                                  placeholder="ขวา"
                                  onChange={ev => handleSetField(i, j, 'repsRight', ev.target.value)}
                                  style={{ width: '100%' }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label style={{ fontSize: 10.5, color: 'var(--mt)', fontWeight: 600, display: 'block', marginBottom: 3 }}>
                                {isTimed ? 'เวลาที่ทำได้ (วินาที)' : 'ทำได้จริง (ครั้ง)'}
                              </label>
                              <input
                                className="n" type="number" step="1"
                                value={set.reps}
                                placeholder={prevSet ? String(prevSet.reps) : String(e.targetReps)}
                                onChange={ev => handleSetField(i, j, 'reps', ev.target.value)}
                                style={{ width: '100%' }}
                              />
                              {prevSet && !set.reps && (
                                <div style={{ fontSize: 10, color: 'var(--mt)', marginTop: 2 }}>
                                  เดิม: {prevSet.reps} {isTimed ? 'วิ' : ''}
                                </div>
                              )}
                            </div>
                          )}
                          <div>
                            <label style={{ fontSize: 10.5, color: 'var(--mt)', fontWeight: 600, display: 'block', marginBottom: 3 }}>
                              {isBW ? 'น้ำหนัก (BW)' : 'น้ำหนัก (กก.)'}
                            </label>
                            <input
                              className="n" type="number" step="0.5"
                              value={set.kg}
                              placeholder={isBW ? '0' : '5'}
                              onChange={ev => handleSetField(i, j, 'kg', ev.target.value)}
                              style={{ width: '100%' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 10.5, color: 'var(--mt)', fontWeight: 600, display: 'block', marginBottom: 3 }}>
                              พัก (วินาที)
                            </label>
                            <input
                              className="n" type="number" step="5"
                              value={set.rest}
                              placeholder={String(e.rest || 60)}
                              onChange={ev => handleSetField(i, j, 'rest', ev.target.value)}
                              style={{ width: '100%' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 10.5, color: 'var(--mt)', fontWeight: 600, display: 'block', marginBottom: 3 }}>
                              RPE (1-10)
                            </label>
                            <input
                              className="n" type="number" step="1" min="1" max="10"
                              value={set.rpe}
                              placeholder="—"
                              onChange={ev => handleSetField(i, j, 'rpe', ev.target.value)}
                              style={{ width: '100%' }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Next Workout Recommendation - Compact */}
                {nextRec && (
                  <div style={{
                    background: 'rgba(18, 24, 32, 0.65)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '7px 10px',
                    marginBottom: 10,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      background: nextRec.badgeBg,
                      color: nextRec.badgeColor,
                      fontWeight: 700,
                      fontSize: 11,
                      padding: '2px 7px',
                      borderRadius: 99,
                      whiteSpace: 'nowrap'
                    }}>
                      {nextRec.icon} {nextRec.badge}
                    </span>
                    <span style={{ color: 'var(--tx2)', lineHeight: 1.35, flex: 1, minWidth: 180 }}>
                      {nextRec.shortText}
                    </span>
                  </div>
                )}

              <input
                style={{ width: '100%', marginTop: 6 }}
                placeholder="📝 หมายเหตุสำหรับท่านี้..."
                value={e.note}
                onChange={ev => handleExNote(i, ev.target.value)}
              />

              <div className="row" style={{ marginTop: 10, gap: 6 }}>
                <button className="b s" onClick={() => addSet(i)} style={{ flex: 1 }}>+ เพิ่มเซ็ต</button>
                <button className={`b s ${e.done ? '' : 'p'}`} onClick={() => completeExercise(i)} style={{ flex: 1 }}>
                  {e.done ? '↩ ยกเลิก' : '✓ เสร็จสิ้นท่านี้'}
                </button>
                <button className="b s d" onClick={() => removeExercise(i)}>ลบ</button>
              </div>
            </div>
          )
        })}

          <div className="card">
            <h3 style={{ marginBottom: 12 }}>➕ เพิ่มท่าฝึกเพิ่มเติม</h3>
            <div className="row" style={{ margin: 0 }}>
              <select
                value={selectedExId || (S.exercises[0]?.id || '')}
                onChange={e => setSelectedExId(e.target.value)}
                style={{ flex: 1 }}
              >
                {S.exercises.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.muscle})</option>
                ))}
              </select>
              <button className="b" type="button" onClick={addExerciseToSession}>+ เพิ่มท่า</button>
            </div>

            <label style={{ marginTop: 16 }}>หมายเหตุสรุปประจำวัน</label>
            <textarea
              rows="2"
              placeholder="ความรู้สึก พลังงาน หรือสิ่งที่อยากจดจำของวันนี้..."
              value={sess.note}
              onChange={ev => handleSessionNote(ev.target.value)}
            />
          </div>

          <div className="card" style={{ background: 'var(--c2)' }}>
            <div className="sp" style={{ flexWrap: 'wrap', gap: 10 }}>
              <div className="row" style={{ margin: 0 }}>
                <button className="b" onClick={saveProgress}>💾 บันทึกความคืบหน้า</button>
                {sess.status === 'completed' ? (
                  <button className="b" onClick={reopenWorkout}>🔓 เปิดแก้ไขการฝึก</button>
                ) : (
                  <button className="b p" onClick={completeWorkout}>🎉 จบการฝึกวันนี้ (Complete)</button>
                )}
              </div>
              <button className="b d" onClick={deleteSession}>🗑 ลบบันทึกวันนี้</button>
            </div>
          </div>
        </>
      )}

      {activeTimerSeconds !== null && (
        <RestTimer
          initialSeconds={activeTimerSeconds}
          onFinish={() => {
            toast('🔔 ครบเวลาพักแล้ว! เริ่มยกเซ็ตต่อไปได้เลย 💪')
            setActiveTimerSeconds(null)
          }}
          onCancel={() => setActiveTimerSeconds(null)}
        />
      )}
    </>
  )
}
