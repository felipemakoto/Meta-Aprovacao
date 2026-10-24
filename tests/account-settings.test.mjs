import test from 'node:test';
import assert from 'node:assert/strict';
import {inQuietHours,sessionReminderAllowed} from '../src/lib/account/reminders.ts';
import {preferenceDefaults as defaults,parsePreferences,daysToExam} from '../src/lib/account/settings-contract.ts';
test('preferências validam todos os campos, sem permissões ou propriedades extras',()=>{
 assert.deepEqual(parsePreferences(defaults),defaults);
 for(const patch of [{role:'admin'},{institution:'fake'},{customCount:200},{dailyGoal:0},{weekdays:[]},{weekdays:[1,1]},{weekdays:[7]},{priorities:['fake']},{course:'x'.repeat(101)},{examDate:'2026-02-30'},{examDate:'2026-99-99'},{fontSize:'giant'},{explanations:'fake'}])assert.throws(()=>parsePreferences({...defaults,...patch}));
});
test('contagem usa a data de São Paulo, sem arredondar pela hora UTC',()=>{assert.equal(daysToExam('2026-10-24',new Date('2026-10-25T01:00:00Z')),0);assert.equal(daysToExam('2026-10-26',new Date('2026-10-25T01:00:00Z')),2);assert.equal(daysToExam(''),null);});

test('avisos respeitam horário silencioso atravessando a meia-noite e controles individuais',()=>{
 const p={...defaults,quietStart:'22:00',quietEnd:'08:00',notifyReview:false};
 assert.equal(inQuietHours(new Date('2026-10-25T02:00:00Z'),'22:00','08:00'),true);
 assert.equal(sessionReminderAllowed('practice',new Date('2026-10-25T15:00:00Z'),p),true);
 assert.equal(sessionReminderAllowed('review',new Date('2026-10-25T15:00:00Z'),p),false);
 assert.equal(sessionReminderAllowed('simulation',new Date('2026-10-25T02:00:00Z'),p),false);
 assert.throws(()=>parsePreferences({...defaults,quietStart:'22:00',quietEnd:''}));
 assert.throws(()=>parsePreferences({...defaults,notifyStudy:'yes'}));
});
