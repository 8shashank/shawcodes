import React, { useCallback, useEffect, useMemo, useState } from 'react';
// import { DateTime } from 'luxon';

const fedHolidays = require("@18f/us-federal-holidays");

const Input = ({ onChange }) => {
    const onTextChange = useCallback((e) => onChange(e.target.value), [onChange]);
    return <input type="text" onChange={onTextChange} />
}

const serviceCenters = {
    'EAC': 'Vermont Service Center',
    'VSC': 'Vermont Service Center',
    'WAC': 'California Service Center',
    'CSC': 'California Service Center',
    'LIN': 'Nebraska Service Center',
    'NSC': 'Nebraska Service Center',
    'SRC': 'Texas Service Center',
    'TSC': 'Texas Service Center',
    'MSC': 'National Benefits Center',
    'NBC': 'National Benefits Center',
    'IOE': 'ELIS (e-Filing)',
    'YSC': 'Potomac Service Center',
    '': ''
};


const splitOrEmpty = (text, startIdx, count) => {
    const endIdx = startIdx + count;
    if (!text || text.length < endIdx) {
        return null;
    }
    return text.slice(startIdx, endIdx);
}

const splitOrMax = (text, startIdx, count) => {
    if (!text || text.length <= startIdx) { return null; }
    const endIdx = startIdx + count;
    return (endIdx >= text.length) ? text.slice(startIdx) : text.slice(startIdx, endIdx)
}

const holidayCache = {};
const getDateKey = (date)=>date.getMonth()*10**2+date.getDate();

const addDays = (startDate, computerDays)=> {
    const nextDate = new Date(startDate);

    let computerDayCount = 0;
    let holidayCount = 0;
    while(computerDayCount<computerDays) {
        nextDate.setDate(nextDate.getDate()+1);
        if (holidayCache[nextDate.getFullYear()][getDateKey(nextDate)]) {
            holidayCount+=1;
        }
        else {
            computerDayCount+=1;
        }
    }
    nextDate.setDate(nextDate.getDate()-holidayCount);

    return nextDate;
}


const getNthWorkingDay = (fiscalYear, computerDay) => {
    const fiscalYearParsed = parseInt(fiscalYear);
    const computerDayParsed = parseInt(computerDay);
    const startDate = new Date(fiscalYearParsed - 1, 8, 30);
    return addDays(startDate, computerDayParsed).toDateString();
}

const getNthWorkingDayRange = (fiscalYear, computerDayStart, computerDayEnd) => {
    const fiscalYearParsed = parseInt(fiscalYear);
    const computerDayStartParsed = parseInt(computerDayStart);
    const computerDayEndParsed = parseInt(computerDayEnd);
    const startDate = new Date(fiscalYearParsed - 1, 8, 30);

    const minDate = addDays(startDate, computerDayStartParsed);
    const maxDate = addDays(minDate, computerDayEndParsed-computerDayStartParsed);
    return {
        min: minDate.toDateString(),
        max: maxDate.toDateString()
    };
}



export const USCISDecoder = () => {
    const [receiptNumber, setReceiptNumber] = useState('');
    const [parsedReceipt, setParsedReceipt] = useState({});
    const [serviceCenter, setServiceCenter] = useState(null);
    const [fiscalYear, setFiscalYear] = useState(null);
    const [dayOfYear, setDayOfYear] = useState(null);
    const [range, setRange] = useState(null);
    const [caseNumber, setCaseNumber] = useState(null);

    useMemo(() => {
        setServiceCenter(parsedReceipt.serviceCenter ? (serviceCenters[parsedReceipt.serviceCenter] || 'Invalid') : null);
    }, [parsedReceipt.serviceCenter]);

    useMemo(() => {
        const yearSuffix = parseInt(parsedReceipt.fiscalYear);
        if (isNaN(yearSuffix)){
            setFiscalYear(null);
            return;
        }

        const year = 2000+yearSuffix;
        setFiscalYear(year)
        if (!holidayCache[year]) {
            holidayCache[year] = fedHolidays.allForYear(year).reduce((cache, {date})=>{
                cache[getDateKey(date)] = true;
                return cache;
            }, {});
        }
        if (!holidayCache[year-1]) {
            holidayCache[year-1] = fedHolidays.allForYear(year-1).reduce((cache, {date})=>{
                cache[getDateKey(date)] = true;
                return cache;
            }, {});
        }
    }, [parsedReceipt.fiscalYear]);

    useMemo(() => {
        if (fiscalYear === null || parsedReceipt.dayOfYear === null) {
            setDayOfYear(null);
        }
        else {
            setDayOfYear(parsedReceipt.dayOfYear ? getNthWorkingDay(fiscalYear, parsedReceipt.dayOfYear) : null)
        }
    }, [fiscalYear, parsedReceipt.dayOfYear])

    useMemo(() => {
        setCaseNumber(parsedReceipt.caseNumber)
    }, [parsedReceipt.caseNumber])

    useMemo(()=> {
        if(!parsedReceipt.dayOfYearIncomplete || parsedReceipt.dayOfYearIncomplete.length === 0 || parsedReceipt.dayOfYearIncomplete.length === 3) {
            setRange(null);
        }
        else {
            const dayOfYearIncomplete = parseInt(parsedReceipt.dayOfYearIncomplete);
            const minWorkingDays = dayOfYearIncomplete*(10**(3-parsedReceipt.dayOfYearIncomplete.length));
            const maxWorkingDays = Math.min(minWorkingDays+10**(3-parsedReceipt.dayOfYearIncomplete.length)-1, 365);
            setRange(getNthWorkingDayRange(fiscalYear, minWorkingDays, maxWorkingDays))
        }
    }, [fiscalYear, parsedReceipt.dayOfYearIncomplete]);

    useEffect(() => {
        if (!receiptNumber) {
            return;
        }

        const validReceiptNumber = receiptNumber.replace(/[^a-z0-9]/gmi, "").replace(/\s+/g, "").toUpperCase();
        const parsedValues = {
            serviceCenter: splitOrEmpty(validReceiptNumber, 0, 3),
            fiscalYear: splitOrEmpty(validReceiptNumber, 3, 2),
            dayRange: splitOrMax(validReceiptNumber, 5, 3),
            dayOfYear: splitOrEmpty(validReceiptNumber, 5, 3),
            dayOfYearIncomplete: splitOrMax(validReceiptNumber, 5, 3),
            caseNumber: splitOrEmpty(validReceiptNumber, 8, 5)
        };
        setParsedReceipt(parsedValues);
    }, [receiptNumber]);

    return (
        <React.Fragment>
            <Input onChange={setReceiptNumber} />
            <div>
                {serviceCenter && <p>{`The service center is ${serviceCenter}`}</p>}
                {fiscalYear && <p>{`The fiscal year is ${fiscalYear}`}</p>}
                {range && <p>{`The approximate range is between ${range.min} and ${range.max}`}<div class="tooltip">*
                        <span class="tooltiptext">Because USCIS also works weekends nowadays, we are counting weekends and only excluding federal holidays. However this may be more inaccurate for older cases.</span>
                    </div></p>}
                {dayOfYear && <p>
                    {`The day of year is approximately ${dayOfYear}`}<div class="tooltip">*
                        <span class="tooltiptext">Because USCIS also works weekends nowadays, we are counting weekends and only excluding federal holidays. However this may be more inaccurate for older cases.</span>
                    </div></p>}
                {caseNumber && <p>{`The case number is ${caseNumber}`}</p>}
            </div>
        </React.Fragment>
    )
}