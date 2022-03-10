import React from 'react';

const readingListContents = [
    {
        name: 'A practical guide to writing technical specs',
        link: 'https://stackoverflow.blog/2020/04/06/a-practical-guide-to-writing-technical-specs/',
        comment: `The specs I write usually end up hitting 90% of the points mentioned in this article, 
        but it is still a good reminder and checklist to go through when starting a new project. Kind of like the Checklist Manifesto for programmers.`
    }
  ];
  
  export const ReadingList = () => (
    <>
      <h1>Reading List</h1>
      <ul>
          {readingListContents.forEach(toRead => (
              <div>
                <li>
                  <a href={toRead.link}>{toRead.comment}</a> : {toRead.comment}
                </li>
              </div>
          ))}
      </ul>
    </>
  );